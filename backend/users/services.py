import hashlib

from django.contrib.auth import get_user_model
from django.db import transaction

from projecthealth_backend.security import create_access_token
from reports.services import EncryptionService


User = get_user_model()


class AuthService:
    def __init__(self) -> None:
        self.encryptor = EncryptionService()

    @staticmethod
    def email_hash(email: str) -> str:
        return hashlib.sha256(email.lower().encode("utf-8")).hexdigest()

    @transaction.atomic
    def handle_callback(self, payload: dict) -> dict:
        user = User.objects.filter(google_id=payload["google_id"], deleted_at__isnull=True).first()
        if not user:
            user = User.objects.create(
                google_id=payload["google_id"],
                email_encrypted=self.encryptor.encrypt_json({"value": payload["email"]}),
                email_hash=self.email_hash(payload["email"]),
                name=payload["name"],
                avatar_url=payload.get("avatar_url"),
                preferred_language="en",
                settings={"notifications": True, "nudges": True},
            )
        token = create_access_token(subject=str(user.id), email=payload["email"])
        return {"access_token": token, "token_type": "bearer", "user_id": str(user.id)}
