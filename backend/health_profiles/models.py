from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class HealthProfile(models.Model):
    class Gender(models.TextChoices):
        FEMALE = "female", "Female"
        MALE = "male", "Male"
        NON_BINARY = "non_binary", "Non-binary"
        OTHER = "other", "Other"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"

    class BloodGroup(models.TextChoices):
        A_POSITIVE = "A+", "A+"
        A_NEGATIVE = "A-", "A-"
        B_POSITIVE = "B+", "B+"
        B_NEGATIVE = "B-", "B-"
        AB_POSITIVE = "AB+", "AB+"
        AB_NEGATIVE = "AB-", "AB-"
        O_POSITIVE = "O+", "O+"
        O_NEGATIVE = "O-", "O-"
        UNKNOWN = "unknown", "Unknown"

    class Frequency(models.TextChoices):
        NEVER = "never", "Never"
        FORMER = "former", "Former"
        OCCASIONAL = "occasional", "Occasional"
        REGULAR = "regular", "Regular"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"

    class FoodPreference(models.TextChoices):
        VEGETARIAN = "vegetarian", "Vegetarian"
        NON_VEGETARIAN = "non_vegetarian", "Non-vegetarian"
        VEGAN = "vegan", "Vegan"
        EGGETARIAN = "eggetarian", "Eggetarian"
        OTHER = "other", "Other"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="health_profile",
    )
    age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(130)],
    )
    gender = models.CharField(max_length=32, choices=Gender.choices, blank=True)
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(260)],
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(350)],
    )
    blood_group = models.CharField(
        max_length=16,
        choices=BloodGroup.choices,
        blank=True,
    )
    occupation = models.CharField(max_length=120, blank=True)
    smoking = models.CharField(
        max_length=32,
        choices=Frequency.choices,
        default=Frequency.PREFER_NOT_TO_SAY,
    )
    alcohol = models.CharField(
        max_length=32,
        choices=Frequency.choices,
        default=Frequency.PREFER_NOT_TO_SAY,
    )
    exercise = models.CharField(max_length=120, blank=True)
    sleep_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
    )
    pregnancy_status = models.CharField(max_length=120, blank=True)
    preferred_language = models.CharField(max_length=64, default="English")
    food_preference = models.CharField(
        max_length=32,
        choices=FoodPreference.choices,
        blank=True,
    )
    location = models.CharField(max_length=160, blank=True)
    privacy_consent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Health profile for {self.user}"

    @property
    def completion_percentage(self) -> int:
        fields = [
            self.age,
            self.gender,
            self.height_cm,
            self.weight_kg,
            self.blood_group,
            self.occupation,
            self.exercise,
            self.sleep_hours,
            self.preferred_language,
            self.food_preference,
            self.location,
            self.privacy_consent,
        ]
        completed = sum(1 for value in fields if value not in [None, "", False])
        return round((completed / len(fields)) * 100)


class Allergy(models.Model):
    profile = models.ForeignKey(
        HealthProfile,
        on_delete=models.CASCADE,
        related_name="allergies",
    )
    name = models.CharField(max_length=120)
    reaction = models.CharField(max_length=240, blank=True)
    severity = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "allergies"

    def __str__(self) -> str:
        return self.name


class KnownCondition(models.Model):
    profile = models.ForeignKey(
        HealthProfile,
        on_delete=models.CASCADE,
        related_name="known_conditions",
    )
    name = models.CharField(max_length=160)
    diagnosed_year = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class FamilyHistoryItem(models.Model):
    profile = models.ForeignKey(
        HealthProfile,
        on_delete=models.CASCADE,
        related_name="family_history",
    )
    relation = models.CharField(max_length=80)
    condition = models.CharField(max_length=160)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["relation", "condition"]

    def __str__(self) -> str:
        return f"{self.relation}: {self.condition}"


class EmergencyContact(models.Model):
    profile = models.ForeignKey(
        HealthProfile,
        on_delete=models.CASCADE,
        related_name="emergency_contacts",
    )
    name = models.CharField(max_length=120)
    relation = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_primary", "name"]

    def __str__(self) -> str:
        return self.name


class ProfileAuditEvent(models.Model):
    profile = models.ForeignKey(
        HealthProfile,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=80)
    summary = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} on {self.profile_id}"
