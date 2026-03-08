from fastapi import APIRouter, BackgroundTasks, Depends
from app.services.demand_service import demand_service
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Demand"])

@router.post(
    "/calculate",
    summary="Iniciar cálculo de demanda",
    description="Dispara o cálculo mensal de demanda em segundo plano.",
    responses={
        200: {
            "description": "Processamento iniciado",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "Cálculo de demanda iniciado em segundo plano.",
                    }
                }
            },
        }
    },
)
def trigger_demand_calculation(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    background_tasks.add_task(
        demand_service.calculate_and_save_all_monthly_demands
    )

    return {
        "success": True,
        "message": "Cálculo de demanda iniciado em segundo plano."
    }