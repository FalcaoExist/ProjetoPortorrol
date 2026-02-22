from fastapi import APIRouter

from app.api.routers.auth_router import router as auth_router
from app.api.routers.users_router import router as users_router
from app.api.routers.suppliers_router import router as suppliers_router
from app.api.routers.orders_router import router as orders_router
from app.api.routers.stock_router import router as stock_router
from app.api.routers.dashboard_router import router as dashboard_router
from app.api.routers.import_router import router as import_router
from app.api.routers.audit_router import router as audit_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(suppliers_router)
router.include_router(orders_router)
router.include_router(stock_router)
router.include_router(dashboard_router)
router.include_router(import_router)
router.include_router(audit_router)
