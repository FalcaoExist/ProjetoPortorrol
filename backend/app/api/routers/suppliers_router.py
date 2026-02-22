from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, get_supplier_service
from app.services.supplier_service import SupplierService
from app.api.schemas import FornecedorCreate, FornecedorResponse

router = APIRouter()

@router.get("/suppliers", response_model=List[FornecedorResponse], operation_id="list_suppliers")
def get_suppliers_list(current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        return supplier_service.get_active_suppliers()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar fornecedores"
        )

@router.post("/suppliers", response_model=FornecedorResponse)
def create_supplier(data: FornecedorCreate, current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        created = supplier_service.create_supplier(data.name, lead_time_days=data.lead_time_days, external_id=data.external_id)
        return created
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Fornecedor ou ID externo já existe.")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/suppliers/{id}")
def delete_supplier(id: str, current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        supplier_service.deactivate_supplier(id)
        return {"message": "Fornecedor inativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
