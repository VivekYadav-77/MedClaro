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
                is_verified=True,  # Google accounts are pre-verified
            )
        token = create_access_token(subject=str(user.id), email=payload["email"])
        return {"access_token": token, "token_type": "bearer", "user_id": str(user.id)}

    @transaction.atomic
    def register(self, payload: dict) -> dict:
        email_hash = self.email_hash(payload["email"])
        if User.objects.filter(email_hash=email_hash).exists():
            raise ValueError("Email already registered")
        
        user = User.objects.create_user(
            email_hash=email_hash,
            name=payload["name"],
            password=payload["password"],
            email_encrypted=self.encryptor.encrypt_json({"value": payload["email"]}),
            preferred_language="en",
            settings={"notifications": True, "nudges": True},
            is_verified=False,  # Needs verification
        )
        token = create_access_token(subject=str(user.id), email=payload["email"])
        return {"access_token": token, "token_type": "bearer", "user_id": str(user.id), "is_verified": False}

    def login(self, payload: dict) -> dict:
        email_hash = self.email_hash(payload["email"])
        user = User.objects.filter(email_hash=email_hash).first()
        
        if not user or not user.check_password(payload["password"]):
            raise ValueError("Invalid credentials")
        
        if not user.is_verified:
            return {"error": "Email not verified", "code": "VERIFICATION_REQUIRED", "user_id": str(user.id)}

        token = create_access_token(subject=str(user.id), email=payload["email"])
        return {"access_token": token, "token_type": "bearer", "user_id": str(user.id)}

    @transaction.atomic
    def guest_login(self, payload: dict) -> dict:
        import uuid
        guest_id = str(uuid.uuid4())
        email = f"guest_{guest_id[:8]}@projecthealth.local"
        email_hash = self.email_hash(email)
        
        user = User.objects.create(
            email_hash=email_hash,
            name=payload.get("name", "Guest"),
            email_encrypted=self.encryptor.encrypt_json({"value": email}),
            is_guest=True,
            is_verified=True,  # Guests don't need verification
            settings={"notifications": False, "nudges": False},
        )
        token = create_access_token(subject=str(user.id), email=email)
        return {"access_token": token, "token_type": "bearer", "user_id": str(user.id), "is_guest": True}
