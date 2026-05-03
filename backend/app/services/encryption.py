import base64
import json
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import get_settings


class EncryptionService:
    def __init__(self) -> None:
        settings = get_settings()
        self.key = base64.urlsafe_b64decode(settings.app_encryption_key)
        self.aesgcm = AESGCM(self.key)

    def encrypt_json(self, payload: dict) -> dict:
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, json.dumps(payload).encode("utf-8"), None)
        return {
            "alg": "AES-256-GCM",
            "nonce": base64.b64encode(nonce).decode("utf-8"),
            "ciphertext": base64.b64encode(ciphertext).decode("utf-8"),
        }

    def decrypt_json(self, payload: dict) -> dict:
        nonce = base64.b64decode(payload["nonce"])
        ciphertext = base64.b64decode(payload["ciphertext"])
        plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(plaintext.decode("utf-8"))
