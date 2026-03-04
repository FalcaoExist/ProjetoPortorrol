from typing import Annotated
from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, 
    HTTPException, UploadFile, Path
)
from app.core.dependencies import get_current_user
from app.services.import_service import process_background
from app.services.import_orders_service import ImportOrdersService
from app.repositories.repositories_supabase import SupabaseUserRepository

router = APIRouter()

@router.post("/stock/import")
async def import_stock(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.lower().endswith((".xlsx")):
        raise HTTPException(400, "Envie um arquivo XLSX Excel")
    contents = await file.read()
    user_id = current_user.get("user_id")
    user_repo = SupabaseUserRepository()
    background_tasks.add_task(process_background, contents, file.filename, user_id, user_repo)
    return {"success": True, "message": "Processamento iniciado em segundo plano."}

@router.post("/imports/pedidos/{supplier}")
async def import_orders_file(supplier: Annotated[str, Path(...)], file: Annotated[UploadFile, File(...)], current_user: dict = Depends(get_current_user)):
    service = ImportOrdersService()
    imported = await service.import_file(supplier, file)
    return {"success": True, "imported": imported}