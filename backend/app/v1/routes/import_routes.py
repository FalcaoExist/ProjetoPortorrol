from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.import_pedidos_service import ImportPedidosService

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.post("/pedidos/{fornecedor}")
async def import_pedidos(fornecedor: str, file: UploadFile = File(...)):
    try:
        service = ImportPedidosService()
        imported = await service.importar(fornecedor, file)
        return {"imported": imported}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
