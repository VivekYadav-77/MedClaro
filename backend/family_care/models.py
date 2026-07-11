import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class FamilyCircle(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_family_circles",
    )
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["owner", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name


class FamilyMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        PARENT = "parent", "Parent"
        CHILD = "child", "Child"
        DOCTOR = "doctor", "Doctor"
        CAREGIVER = "caregiver", "Caregiver"
        EMERGENCY_CONTACT = "emergency_contact", "Emergency Contact"

    class Status(models.TextChoices):
        INVITED = "invited", "Invited"
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Revoked"

    circle = models.ForeignKey(
        FamilyCircle,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="family_memberships",
        null=True,
        blank=True,
    )
    display_name = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=32, choices=Role.choices)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.INVITED)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_family_invitations",
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["role", "display_name"]
        indexes = [
            models.Index(fields=["circle", "role"]),
            models.Index(fields=["circle", "status"]),
            models.Index(fields=["email", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.role})"


class PermissionGrant(models.Model):
    class Permission(models.TextChoices):
        PROFILE = "profile", "Profile"
        REPORTS = "reports", "Reports"
        TRENDS = "trends", "Trends"
        MEDICATIONS = "medications", "Medications"
        SYMPTOMS = "symptoms", "Symptoms"
        JOURNAL = "journal", "Journal"
        DOCTOR_SUMMARY = "doctor_summary", "Doctor Summary"
        EMERGENCY_PROFILE = "emergency_profile", "Emergency Profile"

    membership = models.ForeignKey(
        FamilyMembership,
        on_delete=models.CASCADE,
        related_name="permission_grants",
    )
    permission = models.CharField(max_length=40, choices=Permission.choices)
    is_allowed = models.BooleanField(default=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="family_permission_grants",
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["permission"]
        constraints = [
            models.UniqueConstraint(
                fields=["membership", "permission"],
                name="unique_membership_permission",
            )
        ]

    def __str__(self) -> str:
        return f"{self.membership_id}: {self.permission}"


class FamilyInvitation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REVOKED = "revoked", "Revoked"
        EXPIRED = "expired", "Expired"

    circle = models.ForeignKey(
        FamilyCircle,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    membership = models.OneToOneField(
        FamilyMembership,
        on_delete=models.CASCADE,
        related_name="invitation",
    )
    token = models.CharField(max_length=80, unique=True, default=secrets.token_urlsafe)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token", "status"]),
            models.Index(fields=["circle", "status"]),
        ]

    def __str__(self) -> str:
        return f"Invitation {self.id} to {self.circle_id}"


class FamilyAccessAudit(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="family_access_events",
    )
    circle = models.ForeignKey(
        FamilyCircle,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    membership = models.ForeignKey(
        FamilyMembership,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    action = models.CharField(max_length=80)
    summary = models.CharField(max_length=240, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["circle", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def __str__(self) -> str:
        return self.action


class DoctorSummary(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_summaries",
    )
    title = models.CharField(max_length=180)
    summary_payload = models.JSONField(default=dict)
    questions_for_doctor = models.JSONField(default=list, blank=True)
    model_name = models.CharField(max_length=120)
    prompt_version = models.CharField(max_length=40, default="doctor-summary-v1")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]
        indexes = [
            models.Index(fields=["owner", "generated_at"]),
        ]

    def __str__(self) -> str:
        return self.title


class EmergencyProfileShare(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="emergency_profile_shares",
    )
    label = models.CharField(max_length=180, default="Emergency profile")
    token = models.CharField(max_length=80, unique=True, default=secrets.token_urlsafe)
    qr_payload = models.JSONField(default=dict, blank=True)
    profile_payload = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "is_active"]),
            models.Index(fields=["token", "is_active"]),
            models.Index(fields=["expires_at", "is_active"]),
        ]

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self) -> str:
        return self.label
