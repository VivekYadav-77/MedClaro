from dataclasses import dataclass
import os


DEFAULT_MODEL = "gemini-3.1-flash-lite"


@dataclass(frozen=True)
class GeminiModuleConfig:
    module: str
    api_key_env: str
    model_env: str

    @property
    def api_key(self) -> str:
        return os.getenv(self.api_key_env, "")

    @property
    def model(self) -> str:
        return os.getenv(self.model_env, DEFAULT_MODEL)


GEMINI_MODULES = {
    "report_analysis": GeminiModuleConfig(
        "report_analysis",
        "GEMINI_REPORT_ANALYSIS_API_KEY",
        "GEMINI_REPORT_ANALYSIS_MODEL",
    ),
    "prescription": GeminiModuleConfig(
        "prescription",
        "GEMINI_PRESCRIPTION_API_KEY",
        "GEMINI_PRESCRIPTION_MODEL",
    ),
    "health_assistant": GeminiModuleConfig(
        "health_assistant",
        "GEMINI_HEALTH_ASSISTANT_API_KEY",
        "GEMINI_HEALTH_ASSISTANT_MODEL",
    ),
    "trends": GeminiModuleConfig(
        "trends",
        "GEMINI_TRENDS_API_KEY",
        "GEMINI_TRENDS_MODEL",
    ),
    "diet_exercise": GeminiModuleConfig(
        "diet_exercise",
        "GEMINI_DIET_EXERCISE_API_KEY",
        "GEMINI_DIET_EXERCISE_MODEL",
    ),
    "translation": GeminiModuleConfig(
        "translation",
        "GEMINI_TRANSLATION_API_KEY",
        "GEMINI_TRANSLATION_MODEL",
    ),
    "doctor_summary": GeminiModuleConfig(
        "doctor_summary",
        "GEMINI_DOCTOR_SUMMARY_API_KEY",
        "GEMINI_DOCTOR_SUMMARY_MODEL",
    ),
    "safety_review": GeminiModuleConfig(
        "safety_review",
        "GEMINI_SAFETY_REVIEW_API_KEY",
        "GEMINI_SAFETY_REVIEW_MODEL",
    ),
}
