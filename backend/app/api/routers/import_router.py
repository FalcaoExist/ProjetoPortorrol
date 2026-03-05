import io
import logging
from typing import Annotated
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, File, Path, UploadFile, HTTPException
from app.core.dependencies import get_current_user
from app.services.import_service import process_background
from app.services.import_orders_service import ImportOrdersService
from app.repositories.repositories_supabase import SupabaseUserRepository

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/stock/import")
async def import_stock(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    filename = file.filename.lower()
    
    if not filename.endswith((".xlsx", ".xls")):
        logger.warning(f"Tentativa de importação com formato inválido: {filename} por {user_id}")
        raise HTTPException(400, "Formato inválido. Envie apenas ficheiros Excel (.xlsx ou .xls)")
    
    contents = await file.read()
    
    try:
        df = pd.read_excel(io.BytesIO(contents))
        if df.empty:
            raise ValueError("O ficheiro está vazio.")
    except Exception as e:
        logger.error(f"Erro na validação prévia do Excel: {e}")
        raise HTTPException(400, f"Erro ao processar o ficheiro: {str(e)}")

    # Passamos os bytes para o process_background, que já foi unificado para lidar com auditoria
    background_tasks.add_task(process_background, contents, file.filename, user_id)
    
    logger.info(f"Importação de stock enviada para background: {filename} por {user_id}")
    return {"success": True, "message": "Importação de stock iniciada com sucesso."}


@router.post("/imports/pedidos/{supplier}")
async def import_orders_file(
    supplier: Annotated[str, Path(...)], 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    filename = file.filename.lower()
    
    if not filename.endswith((".xlsx", ".xls")):
        logger.warning(f"Formato de pedido inválido: {filename} para {supplier}")
        raise HTTPException(status_code=400, detail="Formato inválido. Envie um ficheiro Excel.")

    try:
        service = ImportOrdersService()
        count = await service.import_file(supplier, file)
        
        if count == 0:
            logger.info(f"Importação de {supplier} concluída sem novos registros.")
            return {"success": False, "message": "Nenhum registo foi importado. Verifique os dados da planilha."}
            
        logger.info(f"Importação {supplier} concluída: {count} registros por {user_id}")
        return {
            "success": True, 
            "message": f"Sucesso! {count} pedidos da {supplier.upper()} foram importados.",
            "count": count
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception(f"Erro crítico na importação de pedidos {supplier}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o ficheiro.")