from fastapi import APIRouter

from app.api.v1.endpoints import auth, diagnosis, history, users, notifications

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(diagnosis.router)
api_router.include_router(history.router)
api_router.include_router(users.router)
api_router.include_router(notifications.router)
