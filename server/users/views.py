from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.models import Report
from reports.services import StorageService
from reminders.models import Reminder
from users.models import FamilyMember, LifestyleLog, User
from users.serializers import (
    AuthCallbackSerializer,
    FamilyMemberCreateSerializer,
    FamilyMemberSerializer,
    FamilyMemberUpdateSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    GuestLoginSerializer,
)
from users.services import AuthService


class AuthCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = AuthService().handle_callback(serializer.validated_data)
        return Response(data)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            data = AuthService().register(serializer.validated_data)
            return Response(data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            data = AuthService().login(serializer.validated_data)
            if "error" in data:
                return Response(data, status=status.HTTP_403_FORBIDDEN)
            return Response(data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class GuestLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GuestLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = AuthService().guest_login(serializer.validated_data)
        return Response(data)


class VerifyEmailStubView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Stub for future implementation
        user_id = request.data.get("user_id")
        user = User.objects.filter(id=user_id).first()
        if user:
            user.is_verified = True
            user.save()
            return Response({"message": "Email verified successfully (Stub)"})
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class MeView(APIView):
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def put(self, request):
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(request.user, field, value)
        request.user.save()
        return Response(UserProfileSerializer(request.user).data)

    @transaction.atomic
    def delete(self, request):
        storage = StorageService()
        for report in Report.objects.filter(user=request.user):
            if report.file_ref:
                storage.delete_object(report.file_ref)
        Reminder.objects.filter(user=request.user).delete()
        Report.objects.filter(user=request.user).delete()
        request.user.family_members.all().delete()
        request.user.delete()
        return Response({"message": "Account deleted"})


class FamilyListCreateView(APIView):
    def get(self, request):
        members = request.user.family_members.all()
        return Response(FamilyMemberSerializer(members, many=True).data)

    def post(self, request):
        if request.user.family_members.count() >= 5:
            return Response(
                {"error": "You can add up to 5 family profiles", "code": "FAMILY_LIMIT_REACHED"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = FamilyMemberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save(user=request.user)
        return Response(FamilyMemberSerializer(member).data)


class FamilyDeleteView(APIView):
    def patch(self, request, member_id: str):
        member = FamilyMember.objects.filter(id=member_id, user=request.user).first()
        if not member:
            return Response({"error": "Family member not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = FamilyMemberUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(member, field, value)
        member.save()
        return Response(FamilyMemberSerializer(member).data)

    def delete(self, request, member_id: str):
        member = FamilyMember.objects.filter(id=member_id, user=request.user).first()
        if member:
            member.delete()
        Report.objects.filter(user=request.user, family_member_id=member_id).delete()
        return Response({"message": "Family member removed"})


class LifestyleLogView(APIView):
    def get(self, request, log_id=None):
        logs = request.user.lifestyle_logs.filter(active=True)
        return Response([{"id": str(log.id), "note": log.note, "loggedAt": log.logged_at} for log in logs])

    def post(self, request, log_id=None):
        note = request.data.get("note", "").strip()
        if not note or len(note) > 200:
            return Response({"error": "Note must be 1-200 characters"}, status=status.HTTP_400_BAD_REQUEST)
        log = LifestyleLog.objects.create(user=request.user, note=note)
        return Response({"id": str(log.id), "note": log.note, "loggedAt": log.logged_at}, status=status.HTTP_201_CREATED)

    def delete(self, request, log_id=None):
        if not log_id:
            return Response({"error": "Log id required"}, status=status.HTTP_400_BAD_REQUEST)
        LifestyleLog.objects.filter(id=log_id, user=request.user).update(active=False)
        return Response({"message": "Log removed"})
