from django.urls import path

from users.views import (
    AuthCallbackView,
    FamilyDeleteView,
    FamilyListCreateView,
    MeView,
    RegisterView,
    LoginView,
    GuestLoginView,
    LifestyleLogView,
    VerifyEmailStubView,
)


urlpatterns = [
    path("auth/callback", AuthCallbackView.as_view()),
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/guest", GuestLoginView.as_view()),
    path("auth/verify", VerifyEmailStubView.as_view()),
    path("users/me", MeView.as_view()),
    path("lifestyle-logs", LifestyleLogView.as_view()),
    path("lifestyle-logs/<uuid:log_id>", LifestyleLogView.as_view()),
    path("family", FamilyListCreateView.as_view()),
    path("family/<uuid:member_id>", FamilyDeleteView.as_view()),
]
