import re


PII_PATTERNS = [
    re.compile(r"\b(?:name|patient|doctor|hospital)\s*:\s*[^\n]+", re.IGNORECASE),
    re.compile(r"\b(?:address|dob|date of birth)\s*:\s*[^\n]+", re.IGNORECASE),
    re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
]


def strip_pii(text: str) -> str:
    sanitized = text
    for pattern in PII_PATTERNS:
        sanitized = pattern.sub("[REDACTED]", sanitized)
    return sanitized
