import io
from typing import Annotated
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, File, Path, UploadFile, HTTPException
from app.core.dependencies import get_current_user
from app.services.import_service import process_background
from app.services.import_orders_service import ImportOrdersService

router = APIRouter()

# 1. Importação de Stock (Geral)
@router.post("/stock/import")
async def import_stock(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    
    # Restrição estrita: Apenas Excel
    filename = file.filename.lower()
    if not filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Formato inválido. Envie apenas ficheiros Excel (.xlsx ou .xls)")
    
    contents = await file.read()
    try:
        # Leitura exclusiva de Excel
        df = pd.read_excel(io.BytesIO(contents))
        data_batch = df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(400, f"Erro ao processar o ficheiro Excel: {str(e)}")

    if not data_batch:
        raise HTTPException(400, "O ficheiro está vazio.")
        
    background_tasks.add_task(process_background, data_batch, file.filename, user_id)
    return {"success": True, "message": "Importação de stock iniciada."}


# 2. Importação de Pedidos (NSK / Timken)
@router.post("/imports/pedidos/{supplier}")
async def import_orders_file(
    supplier: Annotated[str, Path(...)], 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    # BLOQUEIO RESTRITO: Aceita apenas ficheiros Excel.
    filename = file.filename.lower()
    if not filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Formato inválido. Envie um ficheiro Excel (.xlsx ou .xls).")

    try:
        service = ImportOrdersService()
        count = await service.import_file(supplier, file)
        
        if count == 0:
            return {"success": False, "message": "Nenhum registo foi importado. Verifique os dados da planilha."}
            
        return {
            "success": True, 
            "message": f"Sucesso! {count} pedidos da {supplier.upper()} foram importados.",
            "count": count
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar o Excel: {str(e)}")