import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from projecthealth_backend.choices import BIOLOGICAL_SEX_CHOICES, LANGUAGE_CHOICES


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, google_id: str, email_hash: str, name: str, **extra_fields):
        if not google_id:
            raise ValueError("google_id is required")
        user = self.model(google_id=google_id, email_hash=email_hash, name=name, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, google_id: str, email_hash: str, name: str, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self.create_user(google_id=google_id, email_hash=email_hash, name=name, **extra_fields)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    google_id = models.CharField(max_length=255, unique=True, db_index=True)
    email_encrypted = models.JSONField(default=dict)
    email_hash = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True, null=True)
    dob = models.DateTimeField(blank=True, null=True)
    biological_sex = models.CharField(max_length=20, choices=BIOLOGICAL_SEX_CHOICES, blank=True, null=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "google_id"
    REQUIRED_FIELDS = ["email_hash", "name"]

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class FamilyMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="family_members", on_delete=models.CASCADE)
    name = models.CharField(max_length=60)
    relationship = models.CharField(max_length=40)
    dob = models.DateTimeField()
    biological_sex = models.CharField(max_length=20, choices=BIOLOGICAL_SEX_CHOICES)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.relationship})"
