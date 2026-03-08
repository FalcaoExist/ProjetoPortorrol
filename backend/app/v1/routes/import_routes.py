from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.dependencies import get_audit_service
from app.services.audit_service import AuditService
from app.services.import_orders_service import ImportOrdersService

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.post(
    "/pedidos/{supplier}",
    summary="Importar pedidos (v1)",
    description="Importa pedidos por fornecedor via endpoint legado.",
    responses={
        200: {
            "description": "Importação concluída",
            "content": {
                "application/json": {
                    "example": {"imported": 10}
                }
            },
        },
        400: {"description": "Arquivo inválido ou erro de validação"},
    },
)
async def import_orders(
    supplier: str,
    file: UploadFile = File(...),
    audit_service: AuditService = Depends(get_audit_service),
):
    try:
        service = ImportOrdersService(audit_service)
        imported = await service.import_file(supplier, file)
        return {"imported": imported}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
