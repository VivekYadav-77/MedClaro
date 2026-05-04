import re


INJECTION_PATTERNS = [
    re.compile(r"ignore previous instructions", re.IGNORECASE),
    re.compile(r"you are now", re.IGNORECASE),
    re.compile(r"pretend you are", re.IGNORECASE),
    re.compile(r"\bsystem:\b", re.IGNORECASE),
    re.compile(r"\bassistant:\b", re.IGNORECASE),
    re.compile(r"\broleplay\b", re.IGNORECASE),
]


def sanitize_report_text(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines():
        if any(pattern.search(raw_line) for pattern in INJECTION_PATTERNS):
            continue
        lines.append(raw_line)
    return "\n".join(lines).strip()


def is_off_topic(message: str) -> bool:
    lowered = message.lower()
    if any(pattern.search(lowered) for pattern in INJECTION_PATTERNS):
        return True
    health_keywords = ("report", "blood", "lab", "value", "test", "medicine", "prescription", "range")
    return not any(keyword in lowered for keyword in health_keywords)
