from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.analyze import router as analyze_router
from app.api.routes.result import router as result_router
from app.api.routes.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(analyze_router)
api_router.include_router(result_router)
api_router.include_router(chat_router)
