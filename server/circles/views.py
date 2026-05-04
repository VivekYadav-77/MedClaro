import hashlib

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from circles.models import ActivityFeedEntry, Circle, CircleInvite, CircleMember, FeedReaction, Notification
from circles.serializers import ActivityFeedSerializer, CircleMemberSerializer, CircleSerializer, NotificationSerializer


User = get_user_model()


def user_circle_queryset(user):
    return Circle.objects.filter(members__user=user).distinct()


def get_membership(circle_id, user):
    return CircleMember.objects.filter(circle_id=circle_id, user=user).select_related("circle").first()


class CircleListCreateView(APIView):
    def get(self, request):
        circles = user_circle_queryset(request.user).prefetch_related("members")
        return Response(CircleSerializer(circles, many=True, context={"request": request}).data)

    @transaction.atomic
    def post(self, request):
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "name required"}, status=status.HTTP_400_BAD_REQUEST)
        circle = Circle.objects.create(name=name, created_by=request.user)
        CircleMember.objects.create(circle=circle, user=request.user, role="admin")
        ActivityFeedEntry.objects.create(
            circle=circle,
            actor=request.user,
            event_type="member_joined",
            payload={"name": request.user.name},
        )
        return Response(CircleSerializer(circle, context={"request": request}).data, status=status.HTTP_201_CREATED)


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


class CircleMemberView(APIView):
    def get(self, request, circle_id):
        if not get_membership(circle_id, request.user):
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        members = CircleMember.objects.filter(circle_id=circle_id).select_related("user")
        return Response(CircleMemberSerializer(members, many=True).data)


class CircleInviteView(APIView):
    @transaction.atomic
    def post(self, request, circle_id):
        membership = get_membership(circle_id, request.user)
        if not membership:
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        if membership.role not in {"admin", "contributor"}:
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
        entry = ActivityFeedEntry.objects.create(
            circle=invite.circle,
            actor=request.user,
            event_type="member_joined",
            payload={"name": request.user.name},
        )
        members = CircleMember.objects.filter(circle=invite.circle).exclude(user=request.user).select_related("user")
        Notification.objects.bulk_create([Notification(user=member.user, feed_entry=entry) for member in members])
        return Response({"message": "Invite accepted"})


class CircleFeedView(APIView):
    def get(self, request, circle_id):
        if not get_membership(circle_id, request.user):
            return Response({"error": "Circle not found"}, status=status.HTTP_404_NOT_FOUND)
        entries = ActivityFeedEntry.objects.filter(circle_id=circle_id).select_related("actor")[:50]
        return Response(ActivityFeedSerializer(entries, many=True, context={"request": request}).data)


class NotificationListView(APIView):
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user, read=False).select_related("feed_entry", "feed_entry__actor")[:50]
        return Response(NotificationSerializer(notifications, many=True).data)


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
