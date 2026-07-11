from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


User = get_user_model()


class AccountApiTests(APITestCase):
    def test_register_returns_user_and_token(self):
        response = self.client.post(
            "/api/v1/accounts/register/",
            {
                "username": "new-user",
                "email": "new@example.com",
                "password": "test-password-123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("token", response.data)
        self.assertTrue(User.objects.filter(username="new-user").exists())

    def test_login_returns_token(self):
        User.objects.create_user(username="login-user", password="test-password-123")

        response = self.client.post(
            "/api/v1/accounts/login/",
            {
                "username": "login-user",
                "password": "test-password-123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
