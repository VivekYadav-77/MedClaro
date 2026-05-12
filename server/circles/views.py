import hashlib

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from circles.models import ActivityFeedEntry, Circle, CircleInvite, CircleMember, FeedReaction, Notification, generate_join_code
from circles.serializers import ActivityFeedSerializer, CircleMemberSerializer, CircleSerializer, NotificationSerializer


User = get_user_model()


def user_circle_queryset(user):
    return Circle.objects.filter(members__user=user).distinct()


def get_membership(circle_id, user):
    return CircleMember.objects.filter(circle_id=circle_id, user=user).select_related("circle").first()


def make_unique_join_code() -> str:
    code = generate_join_code()
    while Circle.objects.filter(join_code=code).exists():
        code = generate_join_code()
    return code


class CircleListCreateView(APIView):
    def get(self, request):
        circles = user_circle_queryset(request.user).select_related("created_by").prefetch_related("members")
        return Response(CircleSerializer(circles, many=True, context={"request": request}).data)

    @transaction.atomic
    def post(self, request):
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "name required"}, status=status.HTTP_400_BAD_REQUEST)
        circle = Circle.objects.create(name=name, created_by=request.user, join_code=make_unique_join_code())
        CircleMember.objects.create(circle=circle, user=request.user, role="admin")
        ActivityFeedEntry.objects.create(
            circle=circle,
            actor=request.user,
            event_type="member_joined",
            payload={"name": request.user.name},
        )
        return Response(CircleSerializer(circle, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CircleJoinByCodeView(APIView):
    @transaction.atomic
    def post(self, request):
        code = request.data.get("code", "").strip().upper().replace(" ", "").replace("-", "")
        if not code:
            return Response({"error": "code required"}, status=status.HTTP_400_BAD_REQUEST)
        circle = Circle.objects.filter(join_code=code).first()
        if not circle:
            return Response({"error": "Invalid or expired circle code"}, status=status.HTTP_404_NOT_FOUND)
        _, created = CircleMember.objects.get_or_create(circle=circle, user=request.user, defaults={"role": "viewer"})
        if created:
            entry = ActivityFeedEntry.objects.create(
                circle=circle,
                actor=request.user,
                event_type="member_joined",
                payload={"name": request.user.name},
            )
            members = CircleMember.objects.filter(circle=circle).exclude(user=request.user).select_related("user")
            Notification.objects.bulk_create([Notification(user=member.user, feed_entry=entry) for member in members])
        return Response(CircleSerializer(circle, context={"request": request}).data)


class CircleDetailView(APIView):
    def get(self, request, circle_id):
        circle = user_circle_queryset(request.user).filter(id=circle_id).prefetch_related("members").first()
        if not circle:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(CircleSerializer(circle, context={"request": request}).data)

    def delete(self, request, circle_id):
        membership = get_membership(circle_id, request.user)
        if not membership:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if membership.role != "admin":
            return Response({"error": "Only admins can delete circles"}, status=status.HTTP_403_FORBIDDEN)
        membership.circle.delete()
        return Response({"message": "Circle deleted"})


class CircleHealthDashboardView(APIView):
    def get(self, request, circle_id):
        membership = get_membership(circle_id, request.user)
        if not membership:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)

        from reports.access import accessible_reports
        from reports.views import build_health_context
        from reports.services import ReportHydrator, TrendService

        hydrator = ReportHydrator()
        report_queryset = (
            accessible_reports(request.user, circle_id=circle_id)
            .select_related("user", "family_member")
            .prefetch_related("chat_messages")
            .order_by("-upload_date")
        )
        reports = [hydrator.hydrate(report) for report in report_queryset]
        trends = TrendService().build(reports, request.user.preferred_language)
        feed_entries = (
            ActivityFeedEntry.objects.filter(circle_id=circle_id)
            .select_related("actor")
            .prefetch_related("reactions")[:25]
        )
        members = CircleMember.objects.filter(circle_id=circle_id).select_related("user")
        watch_markers = [
            {
                "testName": marker.get("testName"),
                "value": marker.get("value"),
                "unit": marker.get("unit", ""),
                "flag": marker.get("flag"),
                "reportId": report.get("_id"),
                "reportDate": report.get("reportDate") or report.get("uploadDate"),
                "ownerName": report.get("familyMemberName") or report.get("ownerName"),
                "labName": report.get("labName"),
            }
            for report in reports
            for marker in report.get("structuredData", [])
            if marker.get("flag") != "normal"
        ][:12]
        medication_names = {
            medication.get("name", "").strip().lower()
            for report in reports
            for medication in (report.get("medications") or [])
            if medication.get("name")
        }
        emergency_events = [
            {
                "id": str(entry.id),
                "eventType": entry.event_type,
                "actorName": entry.actor.name if entry.actor else "MedClaro",
                "payload": entry.payload,
                "createdAt": entry.created_at,
            }
            for entry in feed_entries
            if entry.event_type in {"emergency_sos", "emergency_card_accessed"}
        ][:8]

        return Response(
            {
                "circle": CircleSerializer(membership.circle, context={"request": request}).data,
                "members": CircleMemberSerializer(members, many=True).data,
                "reports": reports,
                "trends": trends,
                "healthContext": build_health_context(request.user, circle_id=circle_id, limit=5),
                "feed": ActivityFeedSerializer(feed_entries, many=True, context={"request": request}).data,
                "watchMarkers": watch_markers,
                "medicationSummary": {
                    "medicationCount": len(medication_names),
                    "polypharmacyRisk": "high" if len(medication_names) >= 8 else "moderate" if len(medication_names) >= 5 else "low",
                    "hasPrescription": any(report.get("medications") for report in reports),
                },
                "emergencyEvents": emergency_events,
            }
        )


class CircleJoinCodeRotateView(APIView):
    @transaction.atomic
    def post(self, request, circle_id):
        membership = get_membership(circle_id, request.user)
        if not membership:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if membership.role != "admin":
            return Response({"error": "Only admins can change the circle code"}, status=status.HTTP_403_FORBIDDEN)
        circle = membership.circle
        circle.join_code = make_unique_join_code()
        circle.save(update_fields=["join_code"])
        ActivityFeedEntry.objects.create(
            circle=circle,
            actor=request.user,
            event_type="circle_code_rotated",
            payload={"name": request.user.name},
        )
        return Response(CircleSerializer(circle, context={"request": request}).data)


class CircleMemberView(APIView):
    def get(self, request, circle_id):
        if not get_membership(circle_id, request.user):
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        members = CircleMember.objects.filter(circle_id=circle_id).select_related("user")
        return Response(CircleMemberSerializer(members, many=True).data)


class CircleMemberDetailView(APIView):
    def patch(self, request, circle_id, member_id):
        requester = get_membership(circle_id, request.user)
        if not requester:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if requester.role != "admin":
            return Response({"error": "Only admins can change member roles"}, status=status.HTTP_403_FORBIDDEN)

        member = CircleMember.objects.filter(id=member_id, circle_id=circle_id).select_related("user", "circle").first()
        if not member:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

        role = request.data.get("role", "").strip().lower()
        valid_roles = {choice[0] for choice in CircleMember.ROLE_CHOICES}
        if role not in valid_roles:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        if member.role == "admin" and role != "admin" and not self._has_other_admin(member):
            return Response({"error": "A circle must keep at least one admin"}, status=status.HTTP_400_BAD_REQUEST)

        member.role = role
        member.save(update_fields=["role"])
        ActivityFeedEntry.objects.create(
            circle=member.circle,
            actor=request.user,
            event_type="member_role_changed",
            payload={"memberName": member.user.name, "role": role},
        )
        return Response(CircleMemberSerializer(member).data)

    @transaction.atomic
    def delete(self, request, circle_id, member_id):
        requester = get_membership(circle_id, request.user)
        if not requester:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if requester.role != "admin":
            return Response({"error": "Only admins can remove members"}, status=status.HTTP_403_FORBIDDEN)

        member = CircleMember.objects.filter(id=member_id, circle_id=circle_id).select_related("user", "circle").first()
        if not member:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        if member.user_id == request.user.id:
            return Response({"error": "Admins cannot remove themselves"}, status=status.HTTP_400_BAD_REQUEST)
        if member.role == "admin" and not self._has_other_admin(member):
            return Response({"error": "A circle must keep at least one admin"}, status=status.HTTP_400_BAD_REQUEST)

        circle = member.circle
        member_name = member.user.name
        member.delete()
        entry = ActivityFeedEntry.objects.create(
            circle=circle,
            actor=request.user,
            event_type="member_removed",
            payload={"memberName": member_name},
        )
        remaining_members = CircleMember.objects.filter(circle=circle).select_related("user")
        Notification.objects.bulk_create([Notification(user=item.user, feed_entry=entry) for item in remaining_members])
        return Response({"message": "Member removed"})

    def _has_other_admin(self, member):
        return CircleMember.objects.filter(circle=member.circle, role="admin").exclude(id=member.id).exists()


class CircleInviteView(APIView):
    @transaction.atomic
    def post(self, request, circle_id):
        membership = get_membership(circle_id, request.user)
        if not membership:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if membership.role != "admin":
            return Response({"error": "You cannot invite members"}, status=status.HTTP_403_FORBIDDEN)
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "email required"}, status=status.HTTP_400_BAD_REQUEST)
        email_hash = hashlib.sha256(email.encode("utf-8")).hexdigest()
        invited_user = User.objects.filter(email_hash=email_hash).first()
        if not invited_user:
            return Response({"message": "User not registered"}, status=status.HTTP_404_NOT_FOUND)
        if CircleMember.objects.filter(circle=membership.circle, user=invited_user).exists():
            return Response({"error": "User is already in this circle"}, status=status.HTTP_400_BAD_REQUEST)
        invite = CircleInvite.objects.create(
            circle=membership.circle,
            invited_email_hash=email_hash,
            invited_by=request.user,
        )
        entry = ActivityFeedEntry.objects.create(
            circle=membership.circle,
            actor=request.user,
            event_type="circle_invite",
            payload={"inviteId": str(invite.id), "circleName": membership.circle.name},
        )
        Notification.objects.create(user=invited_user, feed_entry=entry)
        return Response({"id": str(invite.id), "message": "Invite sent"}, status=status.HTTP_201_CREATED)


class CircleInviteAcceptView(APIView):
    @transaction.atomic
    def post(self, request, invite_id):
        invite = CircleInvite.objects.filter(id=invite_id, accepted=False).select_related("circle").first()
        if not invite:
            return Response({"error": "Invite not found"}, status=status.HTTP_404_NOT_FOUND)
        if invite.invited_email_hash != request.user.email_hash:
            return Response({"error": "Invite does not belong to this user"}, status=status.HTTP_403_FORBIDDEN)
        CircleMember.objects.get_or_create(circle=invite.circle, user=request.user, defaults={"role": "viewer"})
        invite.accepted = True
        invite.save(update_fields=["accepted"])
        Notification.objects.filter(user=request.user, feed_entry__payload__inviteId=str(invite.id)).update(read=True)
        entry = ActivityFeedEntry.objects.create(
            circle=invite.circle,
            actor=request.user,
            event_type="member_joined",
            payload={"name": request.user.name},
        )
        members = CircleMember.objects.filter(circle=invite.circle).exclude(user=request.user).select_related("user")
        Notification.objects.bulk_create([Notification(user=member.user, feed_entry=entry) for member in members])
        return Response(CircleSerializer(invite.circle, context={"request": request}).data)


class CircleFeedView(APIView):
    def get(self, request, circle_id):
        if not get_membership(circle_id, request.user):
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        entries = ActivityFeedEntry.objects.filter(circle_id=circle_id).select_related("actor").prefetch_related("reactions")[:50]
        return Response(ActivityFeedSerializer(entries, many=True, context={"request": request}).data)


class NotificationListView(APIView):
    def get(self, request):
        notifications = (
            Notification.objects.filter(user=request.user, read=False)
            .select_related("feed_entry", "feed_entry__actor")
            .prefetch_related("feed_entry__reactions")[:50]
        )
        return Response(NotificationSerializer(notifications, many=True, context={"request": request}).data)


class NotificationMarkReadView(APIView):
    def put(self, request, notification_id):
        notification = Notification.objects.filter(id=notification_id, user=request.user).first()
        if not notification:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
        notification.read = True
        notification.save(update_fields=["read"])
        return Response({"message": "Notification marked read"})


class FeedReactionView(APIView):
    def post(self, request, entry_id):
        entry = ActivityFeedEntry.objects.filter(id=entry_id).select_related("circle").first()
        if not entry:
            return Response({"error": "Entry not found"}, status=status.HTTP_404_NOT_FOUND)
        if not CircleMember.objects.filter(circle=entry.circle, user=request.user).exists():
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        reaction, created = FeedReaction.objects.get_or_create(
            feed_entry=entry,
            user=request.user,
            defaults={"emoji": "celebrate"},
        )
        if not created:
            reaction.delete()
            return Response({"reacted": False, "reactionCount": entry.reactions.count()})
        return Response({"reacted": True, "reactionCount": entry.reactions.count()})
