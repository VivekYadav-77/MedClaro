from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import get_settings


settings = get_settings()


def create_access_token(subject: str, email: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expiry_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
