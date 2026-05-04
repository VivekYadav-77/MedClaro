from pydantic import BaseModel, EmailStr


class AuthCallbackRequest(BaseModel):
    google_id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
