from fastapi import APIRouter

from .routers.auth_router import router as auth_router
from .routers.users_router import router as users_router
from .routers.suppliers_router import router as suppliers_router
from .routers.orders_router import router as orders_router
from .routers.stock_router import router as stock_router
from .routers.dashboard_router import router as dashboard_router
from .routers.import_router import router as import_router
from .routers.audit_router import router as audit_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(suppliers_router)
router.include_router(orders_router)
router.include_router(stock_router)
router.include_router(dashboard_router)
router.include_router(import_router)
router.include_router(audit_router)