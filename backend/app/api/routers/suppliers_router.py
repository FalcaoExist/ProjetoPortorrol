from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, get_supplier_service
from app.services.supplier_service import SupplierService
from app.api.schemas import FornecedorCreate, FornecedorResponse, FornecedorUpdate

router = APIRouter(tags=["Suppliers"])

@router.get(
    "/suppliers",
    response_model=List[FornecedorResponse],
    operation_id="list_suppliers",
    summary="Listar fornecedores",
    description="Retorna fornecedores ativos ou um fornecedor específico quando `supplier_id` for informado.",
    responses={
        200: {
            "description": "Fornecedores retornados com sucesso",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "supplier_id": "00000000-0000-4000-8000-000000000010",
                            "name": "SUPPLIER_DEMO_A",
                            "is_active": True,
                            "external_id": "SUP-DEMO-001",
                            "budget": 10000.0,
                            "start": "2026-01-01",
                            "end": "2026-12-31",
                            "created_at": "2026-01-01T09:00:00Z",
                            "update_at": None,
                            "leadtimes": [
                                {
                                    "branch_id": "00000000-0000-4000-8000-000000000020",
                                    "leadtime": 15,
                                    "leadtime_id": "00000000-0000-4000-8000-000000000021"
                                }
                            ]
                        }
                    ]
                }
            },
        },
        500: {"description": "Erro ao buscar fornecedores"},
    },
)
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

@router.post(
    "/suppliers",
    response_model=FornecedorResponse,
    summary="Criar fornecedor",
    description="Cria um novo fornecedor com dados básicos e leadtimes opcionais.",
    responses={
        200: {
            "description": "Fornecedor criado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "supplier_id": "00000000-0000-4000-8000-000000000011",
                        "name": "SUPPLIER_DEMO_B",
                        "is_active": True,
                        "external_id": "SUP-DEMO-002",
                        "budget": 5000.0,
                        "start": "2026-01-01",
                        "end": "2026-12-31",
                        "created_at": "2026-01-02T09:00:00Z",
                        "update_at": None,
                        "leadtimes": [],
                    }
                }
            },
        },
        400: {"description": "Erro de validação"},
    },
)
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
    
@router.put(
    "/suppliers/{id}",
    response_model=FornecedorResponse,
    summary="Atualizar fornecedor",
    description="Atualiza os dados de um fornecedor existente.",
    responses={
        200: {
            "description": "Fornecedor atualizado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "supplier_id": "00000000-0000-4000-8000-000000000010",
                        "name": "SUPPLIER_DEMO_A_UPDATED",
                        "is_active": True,
                        "external_id": "SUP-DEMO-001",
                        "budget": 12000.0,
                        "start": "2026-01-01",
                        "end": "2026-12-31",
                        "created_at": "2026-01-01T09:00:00Z",
                        "update_at": "2026-04-01T10:00:00Z",
                        "leadtimes": [],
                    }
                }
            },
        },
        400: {"description": "Erro de validação"},
    },
)
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

@router.delete(
    "/suppliers/{id}",
    summary="Inativar fornecedor",
    description="Inativa um fornecedor no sistema.",
    responses={200: {"description": "Fornecedor inativado com sucesso", "content": {"application/json": {"example": {"message": "Fornecedor inativado com sucesso"}}}}, 400: {"description": "Erro de validação"}},
)
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

@router.get(
    "/suppliers/{id}/history",
    summary="Consultar histórico do fornecedor",
    description="Retorna histórico de alterações de um fornecedor.",
    responses={200: {"description": "Histórico retornado com sucesso", "content": {"application/json": {"example": [{"notes": "Alteração de orçamento", "created_at": "2026-04-01T10:00:00Z"}]}}}, 400: {"description": "Erro de validação"}},
)
def get_supplier_history(
    id: UUID,
    #current_user: dict = Depends(get_current_user),
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    try:
        return supplier_service.get_supplier_history(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))