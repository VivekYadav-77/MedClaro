from django.contrib.auth import get_user_model
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication

from projecthealth_backend.security import decode_access_token


User = get_user_model()


class BearerTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            return None
        token = authorization.removeprefix("Bearer ").strip()
        try:
            payload = decode_access_token(token)
        except ValueError as exc:
            raise exceptions.AuthenticationFailed({"error": "Invalid token", "code": "INVALID_TOKEN"}) from exc
        user = User.objects.filter(id=payload["sub"], deleted_at__isnull=True).first()
        if not user:
            raise exceptions.AuthenticationFailed({"error": "User not found", "code": "USER_NOT_FOUND"})
        return user, token
