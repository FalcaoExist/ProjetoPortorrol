import io
import logging
import pandas as pd
from datetime import datetime, timezone
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository
from app.services.demand_service import DemandService

logger = logging.getLogger(__name__)

def parse_value(value, type_cast=float, default=0):
    if value is None or str(value).strip() == "" or str(value).lower() == 'nan':
        return default
    s = str(value).strip().replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")
    if not s: return default
    if s.count(',') > 1: s = s.replace(',', '')
    else:
        if ',' in s and '.' in s: s = s.replace('.', '').replace(',', '.')
        elif ',' in s: s = s.replace(',', '.')
    try:
        val_float = float(s)
        final_value = type_cast(val_float)
        return final_value if final_value > 0 else 0
    except (ValueError, TypeError):
        return default

def process_batch(batch: list, import_repo: ImportRepository) -> int:
    if not batch: return 0
    incoming_data = {}
    unique_brands = set()
    
    for row in batch:
        # Mapeamento exato das colunas do Excel
        codigo = str(row.get('REFERENCIA', '')).strip()
        nome_produto = str(row.get(' ', row.get('nome_produto', ''))).strip() # Coluna vazia no Excel é o Nome
        marca = str(row.get('MARCA', '')).strip()
        classificacao = str(row.get('CLASSIFICACAO', 'Geral')).strip()
        
        if not codigo or codigo.lower() == 'nan': continue
        if marca and marca.lower() != 'nan': unique_brands.add(marca)
        
        unique_key = f"{codigo}|{nome_produto}"
        incoming_data[unique_key] = {
            "codigo": codigo, 
            "nome_produto": nome_produto, 
            "marca": marca, 
            "classificacao": classificacao,
            "row": row
        }

    if not incoming_data: return 0

    try:
        # 1. Upsert Fornecedores
        suppliers_payload = [{"name": b} for b in unique_brands]
        sup_data = import_repo.upsert_suppliers(suppliers_payload)
        sup_map = {s['name'].upper(): s['supplier_id'] for s in sup_data}

        # 2. Upsert SKUs e Captura de IDs reais (A chave de tudo)
        skus_payload = [
            {"codigo": v["codigo"], "nome_produto": v["nome_produto"], "marca": v["marca"], "classificacao": v["classificacao"]} 
            for v in incoming_data.values()
        ]
        res_skus_data = import_repo.upsert_skus(skus_payload)
        sku_map = {f"{s['codigo']}|{s['nome_produto']}": s['id'] for s in res_skus_data}
        sku_ids = list(sku_map.values())

        # 3. Mapear dados vinculados ao sku_id
        ana_res_data = import_repo.get_analises_by_sku_ids(sku_ids)
        sku_to_ana_id = {item['sku_id']: item['id'] for item in ana_res_data}

        payloads = {"analise": [], "hist": [], "costs": [], "demand": [], "prod_sup": []}
        agora = datetime.now(timezone.utc).isoformat()

        for key, sku_id in sku_map.items():
            row = incoming_data[key]["row"]
            supplier_id = sup_map.get(incoming_data[key]["marca"].upper())

            if supplier_id:
                payloads["prod_sup"].append({"sku_id": sku_id, "supplier_id": supplier_id})

            # Mapeamento tb_analise_compra (Conexão SKU_ID)
            ana_item = {
                "sku_id": sku_id,
                "demanda_sp": parse_value(row.get('DEMANDA_10'), int),
                "demanda_jv": parse_value(row.get('DEMANDA_70'), int),
                "demanda_poa": parse_value(row.get('DEMANDA_90'), int),
                "demanda_soma": parse_value(row.get('DEMANDA_SOMA'), int),
                "estoque_sp": parse_value(row.get('ESTOQUE_10'), int),
                "estoque_jv": parse_value(row.get('ESTOQUE_70'), int),
                "estoque_poa": parse_value(row.get('ESTOQUE_90'), int),
                "estoque_soma": parse_value(row.get('ESTOQUE_SOMA'), int),
                "pendencia_sp": parse_value(row.get('PENDENTE_10'), int),
                "pendencia_jv": parse_value(row.get('PENDENTE_70'), int),
                "pendencia_poa": parse_value(row.get('PENDENTE_90'), int),
                "pendencia_soma": parse_value(row.get('PENDENTE_SOMA'), int),
                "falta_sp": parse_value(row.get('FALTA_10'), int),
                "falta_jv": parse_value(row.get('FALTA_70'), int),
                "falta_poa": parse_value(row.get('FALTA_90'), int),
                "falta_soma": parse_value(row.get('FALTA_SOMA'), int),
                "atendimento": parse_value(row.get('ATENDIMENTO'), float),
                "frequencia": parse_value(row.get('FREQUENCIA'), float),
                "sugestao_compra": parse_value(row.get('SUGESTAO_COMPRA_30_DIAS'), int),
                "data_importacao": agora
            }
            if sku_id in sku_to_ana_id: ana_item["id"] = sku_to_ana_id[sku_id]
            payloads["analise"].append(ana_item)

            # Histórico e Cálculo de Demanda (Conexão SKU_ID)
            qtd_cols = [c for c in row.keys() if str(c).startswith('QTD_')]
            soma_qtd, ultimo_valor = 0, 0
            for idx, q_col in enumerate(sorted(qtd_cols), start=1):
                val_q = parse_value(row.get(q_col), int)
                val_v = parse_value(row.get(f"VALOR_{q_col.replace('QTD_','')}") , float)
                soma_qtd += val_q
                if val_v > 0: ultimo_valor = val_v
                payloads["hist"].append({"sku_id": sku_id, "periodo_sequencia": idx, "quantidade": val_q, "valor": val_v})

            if supplier_id and ultimo_valor > 0:
                payloads["costs"].append({"sku_id": sku_id, "supplier_id": supplier_id, "price": ultimo_valor, "valid_from": agora})

            media = soma_qtd / 24 if soma_qtd > 0 else 0
            payloads["demand"].append({
                "sku_id": sku_id, 
                "demanda_media_mensal": round(media, 2), 
                "demanda_media_diaria": round(media / 30, 4),
                "ultima_atualizacao": agora
            })

        # 4. Gravação em lote no Supabase
        if payloads["prod_sup"]: import_repo.upsert_product_suppliers(payloads["prod_sup"])
        if payloads["costs"]: import_repo.upsert_product_costs(payloads["costs"])
        if payloads["demand"]: import_repo.upsert_demanda_mensal(payloads["demand"])
        if payloads["analise"]: import_repo.upsert_analises(payloads["analise"])
        import_repo.replace_history(sku_ids, payloads["hist"])

        return len(sku_map)
    except Exception as e:
        logger.exception("Erro crítico no processamento do lote")
        raise e

def process_background(file_contents: bytes, filename: str, user_id: str):
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()
    demand_service = DemandService()
    try:
        # Apenas EXCEL
        df = pd.read_excel(io.BytesIO(file_contents))
        if df.empty: return

        data_batch = df.to_dict('records')
        success = 0
        chunk_size = 1000
        for i in range(0, len(data_batch), chunk_size):
            success += process_batch(data_batch[i:i + chunk_size], import_repo)

        demand_service.calculate_and_save_all_monthly_demands()
        user_repo.insert_audit_log(performed_by=user_id, action=AuditAction.IMPORT_SUCCESS, entity="import", entity_id=filename, extra={"processed": success})
    except Exception as e_critic:
        user_repo.insert_audit_log(performed_by=user_id, action=AuditAction.SYSTEM_ERROR, entity="import", entity_id=filename, extra={"error": str(e_critic)})
        raise e_critic
