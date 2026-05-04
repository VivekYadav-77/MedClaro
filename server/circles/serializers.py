from rest_framework import serializers

from circles.models import ActivityFeedEntry, Circle, CircleMember, Notification


class CircleSerializer(serializers.ModelSerializer):
    createdBy = serializers.CharField(source="created_by.name", read_only=True)
    memberCount = serializers.IntegerField(source="members.count", read_only=True)
    myRole = serializers.SerializerMethodField()

    class Meta:
        model = Circle
        fields = ["id", "name", "createdBy", "memberCount", "myRole"]

    def get_myRole(self, obj):
        user = self.context.get("request").user if self.context.get("request") else None
        if not user or not user.is_authenticated:
            return None
        membership = obj.members.filter(user=user).first()
        return membership.role if membership else None


class CircleMemberSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source="user.id")
    name = serializers.CharField(source="user.name")
    joinedAt = serializers.DateTimeField(source="joined_at")

    class Meta:
        model = CircleMember
        fields = ["id", "userId", "name", "role", "joinedAt"]


class ActivityFeedSerializer(serializers.ModelSerializer):
    eventType = serializers.CharField(source="event_type")
    actorName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    reactionCount = serializers.SerializerMethodField()
    userHasReacted = serializers.SerializerMethodField()

    class Meta:
        model = ActivityFeedEntry
        fields = ["id", "eventType", "actorName", "payload", "createdAt", "reactionCount", "userHasReacted"]

    def get_actorName(self, obj):
        return obj.actor.name if obj.actor else "MedClaro"

    def get_reactionCount(self, obj):
        return obj.reactions.count()

    def get_userHasReacted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.reactions.filter(user=request.user).exists()


class NotificationSerializer(serializers.ModelSerializer):
    feedEntry = ActivityFeedSerializer(source="feed_entry")
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Notification
        fields = ["id", "read", "feedEntry", "createdAt"]
