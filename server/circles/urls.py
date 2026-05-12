from django.urls import path

from circles.views import (
    CircleDetailView,
    CircleFeedView,
    CircleHealthDashboardView,
    CircleInviteAcceptView,
    CircleInviteView,
    CircleJoinByCodeView,
    CircleJoinCodeRotateView,
    CircleMemberDetailView,
    CircleListCreateView,
    CircleMemberView,
    FeedReactionView,
    NotificationListView,
    NotificationMarkReadView,
)


urlpatterns = [
    path("circles", CircleListCreateView.as_view()),
    path("circles/join", CircleJoinByCodeView.as_view()),
    path("circles/<uuid:circle_id>", CircleDetailView.as_view()),
    path("circles/<uuid:circle_id>/health-dashboard", CircleHealthDashboardView.as_view()),
    path("circles/<uuid:circle_id>/join-code/rotate", CircleJoinCodeRotateView.as_view()),
    path("circles/<uuid:circle_id>/members", CircleMemberView.as_view()),
    path("circles/<uuid:circle_id>/members/<uuid:member_id>", CircleMemberDetailView.as_view()),
    path("circles/<uuid:circle_id>/invite", CircleInviteView.as_view()),
    path("circles/invite/<uuid:invite_id>/accept", CircleInviteAcceptView.as_view()),
    path("circles/<uuid:circle_id>/feed", CircleFeedView.as_view()),
    path("circles/feed/<uuid:entry_id>/react", FeedReactionView.as_view()),
    path("notifications", NotificationListView.as_view()),
    path("notifications/<uuid:notification_id>/read", NotificationMarkReadView.as_view()),
]
