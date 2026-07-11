from ai_services.gemini_config import GEMINI_MODULES
from health_hub.services import build_dashboard

from .models import AccessibilityPreference, LocalizedContentArtifact, VoiceSummaryArtifact


PROMPT_VERSION = "multilingual-accessibility-v1"
SUPPORTED_LANGUAGE_ROADMAP = [
    {"code": "en", "name": "English", "status": "default"},
    {"code": "hi", "name": "Hindi", "status": "phase_10_supported"},
    {"code": "bn", "name": "Bengali", "status": "planned_quality_review"},
    {"code": "ta", "name": "Tamil", "status": "planned_quality_review"},
    {"code": "te", "name": "Telugu", "status": "planned_quality_review"},
    {"code": "mr", "name": "Marathi", "status": "planned_quality_review"},
    {"code": "gu", "name": "Gujarati", "status": "planned_quality_review"},
    {"code": "kn", "name": "Kannada", "status": "planned_quality_review"},
    {"code": "ml", "name": "Malayalam", "status": "planned_quality_review"},
    {"code": "pa", "name": "Punjabi", "status": "planned_quality_review"},
    {"code": "ur", "name": "Urdu", "status": "planned_quality_review"},
]


def get_or_create_preferences(user) -> AccessibilityPreference:
    preference, _created = AccessibilityPreference.objects.get_or_create(
        user=user,
        defaults={
            "preferred_language": _profile_language(user),
            "fallback_language": AccessibilityPreference.Language.ENGLISH,
            "one_click_actions": ["open_hub", "emergency_profile", "read_latest_report"],
            "localization_notes": [
                "English is the fallback language when translation confidence is low.",
                "Medical terms should keep clinically important units and medicine names unchanged.",
            ],
        },
    )
    return preference


def build_accessibility_plan(user) -> dict:
    preference = get_or_create_preferences(user)
    return {
        "supported_languages": SUPPORTED_LANGUAGE_ROADMAP,
        "translation_workflow": {
            "model": GEMINI_MODULES["translation"].model,
            "prompt_version": PROMPT_VERSION,
            "source_policy": "Generate English source first, then translate with medical-term preservation.",
            "quality_checks": [
                "Preserve numbers, units, medicine names, biomarker names, and warning severity.",
                "Back-translate high-risk medical warnings before release.",
                "Fall back to English if translation confidence is low or unsupported language is requested.",
            ],
        },
        "voice_workflow": {
            "text_to_speech": "planned_provider_boundary",
            "speech_to_text": "planned_future_input_boundary",
            "read_aloud_targets": [
                "report explanations",
                "prescription warnings",
                "assistant answers",
                "doctor summaries",
                "emergency profile",
            ],
        },
        "senior_mode_rules": {
            "text": preference.large_text,
            "navigation": "reduced choices with one-click primary actions",
            "motion": "reduced" if preference.reduce_motion else "standard",
            "contrast": "high" if preference.high_contrast else "standard",
            "dashboard": "simplified" if preference.simplified_dashboard else "standard",
        },
        "fallback_language": preference.fallback_language,
    }


def build_simplified_dashboard(user) -> dict:
    dashboard = build_dashboard(user)
    preference = get_or_create_preferences(user)
    return {
        "mode": "senior" if preference.senior_mode else "standard",
        "language": preference.preferred_language,
        "text_size": preference.large_text,
        "high_contrast": preference.high_contrast,
        "one_click_actions": preference.one_click_actions,
        "primary_cards": [
            {
                "title": "Health score",
                "value": dashboard.get("health_score") or "n/a",
                "detail": dashboard.get("health_status", "unknown"),
            },
            {
                "title": "Alerts",
                "value": len(dashboard.get("alerts", [])),
                "detail": "Important items to review",
            },
            {
                "title": "Medicine reminders",
                "value": len(dashboard.get("upcoming_reminders", [])),
                "detail": "Planned or active reminders",
            },
        ],
        "important_actions": [
            {"label": "Open Health Hub", "href": "/hub"},
            {"label": "Emergency Profile", "href": "/family"},
            {"label": "Read Latest Report", "href": "/reports"},
            {"label": "Ask Assistant", "href": "/hub"},
        ],
        "alerts": dashboard.get("alerts", [])[:3],
    }


def create_localized_artifact(user, data: dict) -> LocalizedContentArtifact:
    preference = get_or_create_preferences(user)
    language = data.get("language") or preference.preferred_language
    original_text = data["original_text"]
    localized_text = _mock_translate(original_text, language)
    return LocalizedContentArtifact.objects.create(
        owner=user,
        source_type=data["source_type"],
        source_id=data.get("source_id"),
        language=language,
        fallback_language=preference.fallback_language,
        original_text=original_text,
        localized_text=localized_text,
        literacy_level=data.get("literacy_level", "simple"),
        quality_checks=[
            "Numbers and units preserved.",
            "Medicine and biomarker names preserved.",
            "Fallback language available if review fails.",
        ],
        model_name=GEMINI_MODULES["translation"].model,
        prompt_version=PROMPT_VERSION,
    )


def create_voice_summary(user, data: dict) -> VoiceSummaryArtifact:
    preference = get_or_create_preferences(user)
    language = data.get("language") or preference.preferred_language
    return VoiceSummaryArtifact.objects.create(
        owner=user,
        voice_type=data["voice_type"],
        source_id=data.get("source_id"),
        language=language,
        script_text=data["script_text"],
        provider_status="planned",
        provider_metadata={
            "text_to_speech_provider": "not_selected",
            "speech_to_text_provider": "future_phase",
            "voice_speed": "slow" if preference.senior_mode else "normal",
            "read_aloud_ready": True,
        },
    )


def _profile_language(user) -> str:
    profile = getattr(user, "health_profile", None)
    if not profile:
        return AccessibilityPreference.Language.ENGLISH
    language = (profile.preferred_language or "English").strip().lower()
    if language in {"hindi", "hi"}:
        return AccessibilityPreference.Language.HINDI
    return AccessibilityPreference.Language.ENGLISH


def _mock_translate(text: str, language: str) -> str:
    if language == AccessibilityPreference.Language.ENGLISH:
        return text
    language_name = dict(AccessibilityPreference.Language.choices).get(language, "Selected language")
    return f"[{language_name} draft] {text}"
