from enum import Enum


class BiologicalSex(str, Enum):
    female = "female"
    male = "male"
    intersex = "intersex"
    other = "other"
    undisclosed = "undisclosed"


class Language(str, Enum):
    english = "en"
    hindi = "hi"
    tamil = "ta"
    bengali = "bn"
    telugu = "te"
    marathi = "mr"


class ReportType(str, Enum):
    blood_test = "blood_test"
    lipid_panel = "lipid_panel"
    thyroid_panel = "thyroid_panel"
    urine_analysis = "urine_analysis"
    hba1c = "hba1c"
    vitamin_panel = "vitamin_panel"
    prescription = "prescription"
    xray_report = "xray_report"
    unknown = "unknown"
