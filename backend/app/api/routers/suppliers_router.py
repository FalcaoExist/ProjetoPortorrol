from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, get_supplier_service
from app.services.supplier_service import SupplierService
from app.api.schemas import FornecedorCreate, FornecedorResponse, FornecedorUpdate

router = APIRouter()

@router.get("/suppliers", response_model=List[FornecedorResponse], operation_id="list_suppliers")
def get_suppliers_list(
    supplier_id: UUID = None,
    #current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
    ):
    try:
        if supplier_id:
            supplier = supplier_service.get_supplier_by_id(supplier_id)
            return [supplier] if supplier else []
        return supplier_service.get_active_suppliers()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar fornecedores"
        )

@router.post("/suppliers", response_model=FornecedorResponse)
def create_supplier(
    data: FornecedorCreate, 
    current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
    ):
    try:
        created = supplier_service.create_supplier(
        name=data.name,
        budget=data.budget,
        start=data.start,
        end=data.end,
        leadtimes=[lt.dict() for lt in data.leadtimes] if data.leadtimes else [],
        external_id=data.external_id,
        user_id=current_user.get("user_id"),
    )
        return created
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Fornecedor ou ID externo já existe.")
        raise HTTPException(status_code=400, detail=str(e))
    
@router.put("/suppliers/{id}", response_model=FornecedorResponse)
def update_supplier(
    id: UUID,
    data: FornecedorUpdate,
    current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
    ):
    try:
        return supplier_service.update_supplier(
        supplier_id=id,
        name=data.name,
        budget=data.budget,
        start=data.start,
        end=data.end,
        leadtimes=[lt.dict() for lt in data.leadtimes] if hasattr(data, "leadtimes") else [],
        user_id=current_user.get("user_id"),
    )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/suppliers/{id}")
def delete_supplier(
    id: UUID, 
    current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
    ):
    try:
        supplier_service.deactivate_supplier(id, user_id=current_user.get("user_id"))
        return {"message": "Fornecedor inativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/suppliers/{id}/history")
def get_supplier_history(
    id: UUID,
    #current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    try:
        return supplier_service.get_supplier_history(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))