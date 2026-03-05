import io
import logging
import pandas as pd
from app.audit.audit_actions import AuditAction
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.repositories.import_repository import ImportRepository

logger = logging.getLogger(__name__)

def parse_value(value, type_cast=float, default=0):
    if value is None or str(value).strip() == "" or str(value).lower() == 'nan':
        return default
    
    s = str(value).strip()
    s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")
    
    if not s:
        return default
        
    if s.count(',') > 1:
        s = s.replace(',', '')
    else:
        if ',' in s and '.' in s: s = s.replace('.', '').replace(',', '.')
        elif ',' in s: s = s.replace(',', '.')
        
    try:
        val_float = float(s)
        final_value = type_cast(val_float)
        return final_value if final_value > 0 else 0
    except (ValueError, TypeError):
        logger.debug(f"Falha ao converter valor: {value}")
        return default

def process_batch(batch: list, import_repo: ImportRepository) -> int:
    if not batch:
        return 0

    incoming_data = {}
    unique_brands = set()
    
    for row in batch:
        keys = list(row.keys())
        col_nome = ' ' if ' ' in keys else (keys[0] if keys else 'nome_produto')
        
        nome_produto = str(row.get(col_nome, '')).strip()
        codigo = str(row.get('REFERENCIA', '')).strip()
        marca = str(row.get('MARCA', '')).strip()
        
        if not codigo or codigo.lower() == 'nan':
            continue
        
        if marca and marca.lower() != 'nan':
            unique_brands.add(marca)
        
        unique_key = f"{codigo}|{nome_produto}"
        incoming_data[unique_key] = {
            "codigo": codigo,
            "nome_produto": nome_produto if nome_produto.lower() != 'nan' else 'Item sem nome',
            "marca": marca if marca.lower() != 'nan' and marca != '' else None,
            "classificacao": str(row.get('CLASSIFICACAO', '')).strip(),
            "row": row
        }

    if not incoming_data:
        return 0

    try:
        suppliers_payload = [{"name": b} for b in unique_brands]
        sup_data = import_repo.upsert_suppliers(suppliers_payload)
        sup_name_to_id = {s['name'].upper(): s['supplier_id'] for s in sup_data}

        skus_payload = [
            {
                "codigo": info["codigo"],
                "nome_produto": info["nome_produto"],
                "marca": info["marca"],
                "classificacao": info["classificacao"] if info["classificacao"].lower() != 'nan' else 'Geral'
            }
            for info in incoming_data.values()
        ]

        res_skus_data = import_repo.upsert_skus(skus_payload)

        if not res_skus_data:
            logger.warning("Nenhum SKU foi inserido ou atualizado no lote.")
            return 0

        key_to_sku_id = {f"{item['codigo']}|{item['nome_produto']}": item['id'] for item in res_skus_data}
        sku_ids = list(key_to_sku_id.values())

        ana_res_data = import_repo.get_analises_by_sku_ids(sku_ids)
        sku_to_ana_id = {item['sku_id']: item['id'] for item in ana_res_data}

        analises_payload = []
        history_payload = []
        product_suppliers_payload = []

        for key, sku_id in key_to_sku_id.items():
            info = incoming_data[key]
            row = info["row"]
            
            if info["marca"] and info["marca"].upper() in sup_name_to_id:
                product_suppliers_payload.append({
                    "sku_id": sku_id,
                    "supplier_id": sup_name_to_id[info["marca"].upper()]
                })

            ana_rec = {
                "sku_id": sku_id,
                "demanda_poa": parse_value(row.get('DEMANDA_90'), int),
                "demanda_jv": parse_value(row.get('DEMANDA_70'), int),
                "demanda_sp": parse_value(row.get('DEMANDA_10'), int),
                "demanda_soma": parse_value(row.get('DEMANDA_SOMA'), int),
                "sugestao_compra": parse_value(row.get('SUGESTAO_COMPRA_30_DIAS'), int),
                "estoque_poa": parse_value(row.get('ESTOQUE_90'), int),
                "estoque_jv": parse_value(row.get('ESTOQUE_70'), int),
                "estoque_sp": parse_value(row.get('ESTOQUE_10'), int),
                "estoque_soma": parse_value(row.get('ESTOQUE_SOMA'), int),
                "pendencia_poa": parse_value(row.get('PENDENTE_90'), int),
                "pendencia_jv": parse_value(row.get('PENDENTE_70'), int),
                "pendencia_sp": parse_value(row.get('PENDENTE_10'), int),
                "pendencia_soma": parse_value(row.get('PENDENTE_SOMA'), int),
                "falta_poa": parse_value(row.get('FALTA_90'), int),
                "falta_jv": parse_value(row.get('FALTA_70'), int),
                "falta_sp": parse_value(row.get('FALTA_10'), int),
                "falta_soma": parse_value(row.get('FALTA_SOMA'), int),
                "atendimento": parse_value(row.get('ATENDIMENTO'), float),
                "frequencia": parse_value(row.get('FREQUENCIA'), float),
                "data_importacao": "now()"
            }
            if sku_id in sku_to_ana_id:
                ana_rec["id"] = sku_to_ana_id[sku_id]
            analises_payload.append(ana_rec)

            qtd_cols = [c for c in row.keys() if str(c).startswith('QTD_')]
            for idx, q_col in enumerate(sorted(qtd_cols), start=1):
                mes_ano = q_col.replace('QTD_', '')
                history_payload.append({
                    "sku_id": sku_id,
                    "periodo_sequencia": idx,
                    "quantidade": parse_value(row.get(q_col), int),
                    "valor": parse_value(row.get(f"VALOR_{mes_ano}"), float)
                })

        if product_suppliers_payload:
            import_repo.upsert_product_suppliers(product_suppliers_payload)
        
        if analises_payload:
            import_repo.upsert_analises(analises_payload)
        
        import_repo.replace_history(sku_ids, history_payload)

        logger.info(f"Lote processado com sucesso: {len(key_to_sku_id)} SKUs sincronizados.")
        return len(key_to_sku_id)

    except Exception as e:
        logger.exception("Erro crítico no processamento do lote de importação no repositório")
        raise e

def process_background(file_contents: bytes, filename: str, user_id: str):
    user_repo = SupabaseUserRepository()
    import_repo = ImportRepository()

    logger.info(f"Iniciando importação de arquivo - usuário: {user_id} - arquivo: {filename}")

    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except Exception as e:
                logger.debug(f"Falha ao ler CSV com UTF-8, tentando latin-1: {e}")
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        if df.empty or len(df.columns) < 2:
            logger.warning(f"Arquivo vazio ou inválido na importação - usuário: {user_id} - arquivo: {filename}")
            try:
                user_repo.insert_audit_log(
                    performed_by=user_id,
                    action=AuditAction.IMPORT_FILE_FAILURE,
                    entity="import",
                    entity_id=filename,
                    extra={"reason": "Arquivo vazio ou colunas insuficientes"}
                )
            except Exception as e:
                logger.exception("Falha ao registrar auditoria de arquivo inválido")
                raise RuntimeError("Falha ao registrar auditoria de arquivo inválido") from e
            return

        data_batch = df.to_dict('records')
        success = 0
        errors = 0
        chunk_size = 250
        
        for i in range(0, len(data_batch), chunk_size):
            chunk = data_batch[i:i + chunk_size]
            try:
                processed_count = process_batch(chunk, import_repo)
                success += processed_count
            except Exception as e:
                errors += len(chunk)
                logger.error(f"Erro ao importar lote {i} - usuário: {user_id} - erro: {e}")
                try:
                    user_repo.insert_audit_log(
                        performed_by=user_id,
                        action=AuditAction.IMPORT_ROW_FAILURE,
                        entity="import",
                        entity_id=f"{filename} (Lote {i})",
                        extra={"reason": str(e)}
                    )
                except Exception:
                    logger.exception("Falha ao registrar auditoria de erro do lote")

        logger.info(f"Importação concluída - usuário: {user_id} - arquivo: {filename} - sucesso: {success} - erros: {errors}")

        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.IMPORT_SUCCESS,
                entity="import",
                entity_id=filename,
                extra={"processed": success, "errors": errors}
            )
        except Exception as e:
            logger.exception("Falha ao registrar auditoria de sucesso da importação")
            raise RuntimeError("Falha ao registrar auditoria de sucesso da importação") from e

    except Exception as e_critic:
        logger.exception(f"Erro crítico na importação - usuário: {user_id} - arquivo: {filename}")
        try:
            user_repo.insert_audit_log(
                performed_by=user_id,
                action=AuditAction.SYSTEM_ERROR,
                entity="import",
                entity_id=filename,
                extra={"error": str(e_critic)}
            )
        except Exception as e:
            logger.exception("Falha ao registrar auditoria de erro crítico")
            raise RuntimeError("Falha ao registrar auditoria de erro crítico") from e
        raise e_critic