from fastapi import APIRouter

from app.schemas.auth import AuthCallbackRequest, AuthResponse
from app.services.auth import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.post("/callback", response_model=AuthResponse)
async def auth_callback(payload: AuthCallbackRequest) -> AuthResponse:
    return await service.handle_callback(payload)
