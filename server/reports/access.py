from django.db.models import Q

from reports.models import Report, ReportShare


ACTIVE_SHARE = "active"
CARE_ROLES = {"admin", "caregiver"}


def get_membership(circle_id, user):
    if not circle_id:
        return None
    try:
        from circles.models import CircleMember
    except Exception:
        return None
    return CircleMember.objects.filter(circle_id=circle_id, user=user).select_related("circle").first()


def can_contribute_to_circle(circle_id, user) -> bool:
    membership = get_membership(circle_id, user)
    return bool(membership and membership.role in CARE_ROLES)


def user_circle_ids(user):
    try:
        from circles.models import CircleMember
    except Exception:
        return []
    return CircleMember.objects.filter(user=user).values_list("circle_id", flat=True)


def accessible_reports(user, circle_id=None):
    if not circle_id:
        return Report.objects.filter(user=user)

    membership = get_membership(circle_id, user)
    if not membership:
        return Report.objects.none()

    return Report.objects.filter(
        Q(user=user, shares__circle_id=circle_id, shares__status=ACTIVE_SHARE)
        | Q(shares__circle_id=circle_id, shares__status=ACTIVE_SHARE)
    ).distinct()


def shared_or_owned_reports(user):
    return Report.objects.filter(
        Q(user=user)
        | Q(shares__circle_id__in=user_circle_ids(user), shares__status=ACTIVE_SHARE)
    ).distinct()


def share_report_with_circle(report, circle_id, actor):
    membership = get_membership(circle_id, actor)
    if not membership:
        raise PermissionError("Circle not found")
    if report.user_id != actor.id:
        raise PermissionError("Only the report owner can share this report")
    if membership.role not in CARE_ROLES:
        raise PermissionError("View-only members cannot share reports")

    share, _ = ReportShare.objects.update_or_create(
        report=report,
        circle_id=circle_id,
        defaults={
            "shared_by": actor,
            "consent_granted_by": report.user,
            "access_level": "view",
            "status": ACTIVE_SHARE,
            "revoked_at": None,
        },
    )
    return share
