from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from ai_services.gemini_config import GEMINI_MODULES
from daily_health.models import JournalEntry, SymptomLog
from health_profiles.models import HealthProfile
from health_trends.models import TrendInsight
from medication_intelligence.models import Medication, MedicationWarning
from report_analysis.models import ReportAnalysis

from .models import (
    DoctorSummary,
    EmergencyProfileShare,
    FamilyAccessAudit,
    FamilyCircle,
    FamilyInvitation,
    FamilyMembership,
    PermissionGrant,
)


PROMPT_VERSION = "doctor-summary-v1"

ROLE_DEFAULT_PERMISSIONS = {
    FamilyMembership.Role.OWNER: [
        PermissionGrant.Permission.PROFILE,
        PermissionGrant.Permission.REPORTS,
        PermissionGrant.Permission.TRENDS,
        PermissionGrant.Permission.MEDICATIONS,
        PermissionGrant.Permission.SYMPTOMS,
        PermissionGrant.Permission.JOURNAL,
        PermissionGrant.Permission.DOCTOR_SUMMARY,
        PermissionGrant.Permission.EMERGENCY_PROFILE,
    ],
    FamilyMembership.Role.PARENT: [
        PermissionGrant.Permission.PROFILE,
        PermissionGrant.Permission.REPORTS,
        PermissionGrant.Permission.MEDICATIONS,
        PermissionGrant.Permission.SYMPTOMS,
        PermissionGrant.Permission.EMERGENCY_PROFILE,
    ],
    FamilyMembership.Role.CHILD: [
        PermissionGrant.Permission.PROFILE,
        PermissionGrant.Permission.EMERGENCY_PROFILE,
    ],
    FamilyMembership.Role.DOCTOR: [
        PermissionGrant.Permission.PROFILE,
        PermissionGrant.Permission.REPORTS,
        PermissionGrant.Permission.TRENDS,
        PermissionGrant.Permission.MEDICATIONS,
        PermissionGrant.Permission.SYMPTOMS,
        PermissionGrant.Permission.DOCTOR_SUMMARY,
    ],
    FamilyMembership.Role.CAREGIVER: [
        PermissionGrant.Permission.PROFILE,
        PermissionGrant.Permission.MEDICATIONS,
        PermissionGrant.Permission.SYMPTOMS,
        PermissionGrant.Permission.EMERGENCY_PROFILE,
    ],
    FamilyMembership.Role.EMERGENCY_CONTACT: [
        PermissionGrant.Permission.EMERGENCY_PROFILE,
    ],
}


@transaction.atomic
def create_family_circle(owner, name: str, description: str = "") -> FamilyCircle:
    circle = FamilyCircle.objects.create(owner=owner, name=name, description=description)
    membership = FamilyMembership.objects.create(
        circle=circle,
        user=owner,
        display_name=owner.get_username(),
        email=getattr(owner, "email", ""),
        role=FamilyMembership.Role.OWNER,
        status=FamilyMembership.Status.ACTIVE,
        invited_by=owner,
        accepted_at=timezone.now(),
    )
    _grant_defaults(membership, owner)
    _audit(owner, circle, membership, "circle_created", "Family care circle created.")
    return circle


@transaction.atomic
def invite_member(circle: FamilyCircle, actor, data: dict) -> FamilyInvitation:
    membership = FamilyMembership.objects.create(
        circle=circle,
        display_name=data["display_name"],
        email=data.get("email", ""),
        role=data["role"],
        status=FamilyMembership.Status.INVITED,
        invited_by=actor,
    )
    _grant_defaults(membership, actor)
    invitation = FamilyInvitation.objects.create(
        circle=circle,
        membership=membership,
        expires_at=timezone.now() + timedelta(days=data.get("expires_in_days", 14)),
    )
    _audit(actor, circle, membership, "member_invited", f"Invited {membership.display_name}.")
    return invitation


@transaction.atomic
def accept_invitation(invitation: FamilyInvitation, user) -> FamilyMembership:
    invitation.status = FamilyInvitation.Status.ACCEPTED
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at"])
    membership = invitation.membership
    membership.user = user
    membership.status = FamilyMembership.Status.ACTIVE
    membership.accepted_at = timezone.now()
    membership.save(update_fields=["user", "status", "accepted_at", "updated_at"])
    _audit(user, invitation.circle, membership, "invitation_accepted", "Family invitation accepted.")
    return membership


@transaction.atomic
def revoke_membership(membership: FamilyMembership, actor) -> FamilyMembership:
    membership.status = FamilyMembership.Status.REVOKED
    membership.revoked_at = timezone.now()
    membership.save(update_fields=["status", "revoked_at", "updated_at"])
    membership.permission_grants.update(is_allowed=False)
    invitation = getattr(membership, "invitation", None)
    if invitation:
        invitation.status = FamilyInvitation.Status.REVOKED
        invitation.revoked_at = timezone.now()
        invitation.save(update_fields=["status", "revoked_at"])
    _audit(actor, membership.circle, membership, "membership_revoked", f"Revoked {membership.display_name}.")
    return membership


def build_family_dashboard(owner) -> dict:
    circles = FamilyCircle.objects.filter(owner=owner, is_active=True).prefetch_related(
        "memberships",
        "memberships__permission_grants",
    )
    alerts = []
    for circle in circles:
        pending = circle.invitations.filter(status=FamilyInvitation.Status.PENDING).count()
        if pending:
            alerts.append(
                {
                    "kind": "pending_invitation",
                    "title": f"{pending} pending invitation(s)",
                    "summary": f"{circle.name} has invitations waiting for acceptance.",
                }
            )
    return {
        "circles": [
            {
                "id": circle.id,
                "name": circle.name,
                "description": circle.description,
                "member_count": circle.memberships.count(),
                "active_member_count": circle.memberships.filter(status=FamilyMembership.Status.ACTIVE).count(),
            }
            for circle in circles
        ],
        "alerts": alerts,
        "recent_audit": [
            {
                "action": event.action,
                "summary": event.summary,
                "created_at": event.created_at,
            }
            for event in FamilyAccessAudit.objects.filter(circle__owner=owner).order_by("-created_at")[:8]
        ],
    }


def generate_doctor_summary(owner) -> DoctorSummary:
    payload = build_doctor_summary_payload(owner)
    questions = [
        "Which report or trend should I prioritize at my next visit?",
        "Do my medicines or allergies require any changes?",
        "Are my recent symptoms or journal patterns clinically important?",
    ]
    return DoctorSummary.objects.create(
        owner=owner,
        title="Doctor-ready health summary",
        summary_payload=payload,
        questions_for_doctor=questions,
        model_name=GEMINI_MODULES["doctor_summary"].model,
        prompt_version=PROMPT_VERSION,
    )


def build_doctor_summary_payload(owner) -> dict:
    profile = getattr(owner, "health_profile", None)
    return {
        "patient_identity": _profile_identity(profile, owner),
        "known_conditions": _profile_relation(profile, "known_conditions", ["name", "status", "diagnosed_year"]),
        "allergies": _profile_relation(profile, "allergies", ["name", "reaction", "severity"]),
        "current_medicines": [
            {
                "brand_name": medication.brand_name,
                "active_ingredient": medication.active_ingredient,
                "strength": medication.strength,
                "purpose": medication.purpose,
            }
            for medication in Medication.objects.filter(owner=owner).order_by("brand_name")[:12]
        ],
        "recent_reports": [
            {
                "document_title": report.document.title,
                "health_score": report.health_score,
                "health_status": report.health_status,
                "key_findings": report.key_findings[:3],
            }
            for report in ReportAnalysis.objects.filter(owner=owner).select_related("document").order_by("-created_at")[:5]
        ],
        "important_biomarker_trends": [
            {
                "biomarker": trend.biomarker_name,
                "label": trend.label,
                "latest_value": trend.latest_value,
                "unit": trend.unit,
            }
            for trend in TrendInsight.objects.filter(owner=owner).order_by("label", "biomarker_name")[:8]
        ],
        "risk_factors": _risk_factors(owner, profile),
        "symptoms": [
            {
                "symptom": symptom.symptom,
                "severity": symptom.severity,
                "pain_level": symptom.pain_level,
                "started_at": symptom.started_at.isoformat(),
                "doctor_consultation_recommended": symptom.doctor_consultation_recommended,
            }
            for symptom in SymptomLog.objects.filter(owner=owner).order_by("-started_at")[:8]
        ],
        "journal_patterns": [
            {
                "entry_date": entry.entry_date,
                "mood": entry.mood,
                "stress": entry.stress,
                "sleep_hours": str(entry.sleep_hours) if entry.sleep_hours is not None else None,
                "notes": entry.notes[:180],
            }
            for entry in JournalEntry.objects.filter(owner=owner).order_by("-entry_date", "-created_at")[:8]
        ],
    }


def create_emergency_share(owner, expires_in_hours: int = 72) -> EmergencyProfileShare:
    expires_at = timezone.now() + timedelta(hours=expires_in_hours)
    payload = build_emergency_profile(owner)
    share = EmergencyProfileShare.objects.create(
        owner=owner,
        expires_at=expires_at,
        profile_payload=payload,
    )
    share.qr_payload = {
        "type": "medclaro_emergency_profile",
        "token": share.token,
        "expires_at": expires_at.isoformat(),
        "access_path": f"/api/v1/family-care/emergency-shares/{share.token}/public/",
    }
    share.save(update_fields=["qr_payload"])
    return share


def build_emergency_profile(owner) -> dict:
    profile = getattr(owner, "health_profile", None)
    return {
        "blood_group": profile.blood_group if profile else "",
        "allergies": _profile_relation(profile, "allergies", ["name", "reaction", "severity"]),
        "current_medicines": [
            {
                "brand_name": medication.brand_name,
                "active_ingredient": medication.active_ingredient,
                "strength": medication.strength,
            }
            for medication in Medication.objects.filter(owner=owner).order_by("brand_name")[:12]
        ],
        "known_diseases": _profile_relation(profile, "known_conditions", ["name", "status"]),
        "emergency_contacts": _profile_relation(profile, "emergency_contacts", ["name", "relation", "phone", "email", "is_primary"]),
        "insurance": [],
        "doctor_contacts": [],
        "safety_notes": [
            "Emergency profile is limited to critical information.",
            "Access tokens expire and can be revoked by the owner.",
        ],
    }


def access_emergency_share(share: EmergencyProfileShare) -> dict:
    share.last_accessed_at = timezone.now()
    share.save(update_fields=["last_accessed_at"])
    return share.profile_payload


def _grant_defaults(membership: FamilyMembership, actor) -> None:
    for permission in ROLE_DEFAULT_PERMISSIONS.get(membership.role, []):
        PermissionGrant.objects.create(
            membership=membership,
            permission=permission,
            granted_by=actor,
        )


def _audit(actor, circle, membership, action: str, summary: str, metadata: dict | None = None) -> None:
    FamilyAccessAudit.objects.create(
        actor=actor,
        circle=circle,
        membership=membership,
        action=action,
        summary=summary,
        metadata=metadata or {},
    )


def _profile_identity(profile: HealthProfile | None, owner) -> dict:
    return {
        "username": owner.get_username(),
        "email": getattr(owner, "email", ""),
        "age": profile.age if profile else None,
        "gender": profile.gender if profile else "",
        "blood_group": profile.blood_group if profile else "",
        "location": profile.location if profile else "",
    }


def _profile_relation(profile, relation: str, fields: list[str]) -> list[dict]:
    if not profile:
        return []
    return [
        {field: getattr(item, field) for field in fields}
        for item in getattr(profile, relation).all()
    ]


def _risk_factors(owner, profile) -> list[str]:
    factors = []
    if profile and profile.smoking == HealthProfile.Frequency.REGULAR:
        factors.append("Regular smoking recorded in profile.")
    if MedicationWarning.objects.filter(
        analysis__owner=owner,
        severity__in=[
            MedicationWarning.Severity.HIGH,
            MedicationWarning.Severity.CRITICAL,
        ],
    ).exists():
        factors.append("High-risk medication warning exists.")
    if SymptomLog.objects.filter(owner=owner, doctor_consultation_recommended=True).exists():
        factors.append("Recent symptom log recommended doctor consultation.")
    return factors
