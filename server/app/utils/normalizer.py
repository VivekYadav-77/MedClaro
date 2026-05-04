from collections.abc import Callable


ConversionFn = Callable[[float], float]


def identity(value: float) -> float:
    return value


CONVERSION_TABLE: dict[tuple[str, str], tuple[str, ConversionFn]] = {
    ("glucose", "mg/dL"): ("mmol/L", lambda value: round(value / 18.0, 2)),
    ("cholesterol", "mg/dL"): ("mmol/L", lambda value: round(value / 38.67, 2)),
    ("hemoglobin", "g/dL"): ("g/dL", identity),
    ("creatinine", "mg/dL"): ("umol/L", lambda value: round(value * 88.4, 2)),
    ("tsh", "mIU/L"): ("mIU/L", identity),
    ("t3", "ng/dL"): ("ng/dL", identity),
    ("t4", "ug/dL"): ("ug/dL", identity),
    ("b12", "pg/mL"): ("pmol/L", lambda value: round(value * 0.7378, 2)),
    ("vitamin d", "ng/mL"): ("nmol/L", lambda value: round(value * 2.5, 2)),
    ("iron", "ug/dL"): ("umol/L", lambda value: round(value * 0.1791, 2)),
    ("ferritin", "ng/mL"): ("ng/mL", identity),
}


def normalize_value(test_name: str, value: float, unit: str) -> tuple[float | None, str | None]:
    key = (test_name.strip().lower(), unit.strip())
    if key not in CONVERSION_TABLE:
        return None, None
    normalized_unit, converter = CONVERSION_TABLE[key]
    return converter(value), normalized_unit
