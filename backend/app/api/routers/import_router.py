import io
from typing import Annotated
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, File, Path, UploadFile, HTTPException
from app.core.dependencies import get_current_user
from app.services.import_service import process_background
from app.services.import_orders_service import ImportOrdersService

router = APIRouter()

@router.post("/stock/import")
async def import_stock(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Envie um arquivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        # O pandas resolve o problema do Unicode (byte 0xfa) automaticamente ao ler o Excel
        df = pd.read_excel(io.BytesIO(contents))
        data_batch = df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(400, f"Erro ao processar Excel: {str(e)}")

    if not data_batch:
        raise HTTPException(400, "O arquivo está vazio.")
        
    background_tasks.add_task(process_background, data_batch, file.filename, user_id)
    
    return {"success": True, "message": "Importação iniciada."}

@router.post("/imports/pedidos/{supplier}")
async def import_orders_file(supplier: Annotated[str, Path(...)], file: Annotated[UploadFile, File(...)], current_user: dict = Depends(get_current_user)):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Envie um arquivo Excel (.xlsx)")
        
    service = ImportOrdersService()
    imported = await service.import_file(supplier, file)
    return {"success": True, "imported": imported}