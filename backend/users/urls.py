from django.urls import path

from users.views import AuthCallbackView, FamilyDeleteView, FamilyListCreateView, MeView


urlpatterns = [
    path("auth/callback", AuthCallbackView.as_view()),
    path("users/me", MeView.as_view()),
    path("family", FamilyListCreateView.as_view()),
    path("family/<uuid:member_id>", FamilyDeleteView.as_view()),
]
