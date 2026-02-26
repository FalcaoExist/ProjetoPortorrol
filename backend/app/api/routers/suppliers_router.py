from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, get_supplier_service
from app.services.supplier_service import SupplierService
from app.api.schemas import FornecedorCreate, FornecedorResponse, FornecedorUpdate

router = APIRouter()

# RETIRADO get_current_user ENQUANTO NÃO ESTÁ FUNCIONANDO
@router.get("/suppliers")
def get_suppliers_list(current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        fornecedores = supplier_service.get_active_suppliers()
        # Mapeia a lista de dicionários para devolver APENAS uma lista de strings com os nomes
        return [f.get("name") for f in fornecedores if f.get("name")]
    except Exception as e:
        print(f"Erro na rota de fornecedores: {e}")
        return []

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