import hashlib
from datetime import UTC, datetime
from uuid import uuid4

from app.core.database import get_database
from app.core.security import create_access_token
from app.schemas.auth import AuthCallbackRequest, AuthResponse
from app.services.encryption import EncryptionService


class AuthService:
    def __init__(self) -> None:
        self.db = get_database()
        self.encryptor = EncryptionService()

    @staticmethod
    def email_hash(email: str) -> str:
        return hashlib.sha256(email.lower().encode("utf-8")).hexdigest()

    async def handle_callback(self, payload: AuthCallbackRequest) -> AuthResponse:
        existing = await self.db.users.find_one({"googleId": payload.google_id, "deletedAt": None})
        if not existing:
            user_id = str(uuid4())
            await self.db.users.insert_one(
                {
                    "_id": user_id,
                    "googleId": payload.google_id,
                    "email": self.encryptor.encrypt_json({"value": payload.email}),
                    "emailHash": self.email_hash(payload.email),
                    "name": payload.name,
                    "dob": None,
                    "biologicalSex": None,
                    "preferredLanguage": "en",
                    "familyMembers": [],
                    "settings": {"notifications": True, "nudges": True},
                    "createdAt": datetime.now(UTC),
                    "deletedAt": None,
                }
            )
            existing = await self.db.users.find_one({"_id": user_id})
        token = create_access_token(subject=existing["_id"], email=payload.email)
        return AuthResponse(access_token=token, user_id=existing["_id"])
