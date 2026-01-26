from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.import_orders_service import ImportOrdersService

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.post("/pedidos/{supplier}")
async def import_orders(supplier: str, file: UploadFile = File(...)):
    try:
        service = ImportOrdersService()
        imported = await service.import_file(supplier, file)
        return {"imported": imported}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
