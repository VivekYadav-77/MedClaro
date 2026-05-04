import { Report, TrendResponse, UserProfile } from "@/lib/types";

export const mockUser: UserProfile = {
  _id: "4d4c4040-4bbf-4ed2-bc3e-41f4e767a777",
  name: "Aarav Mehta",
  email: "aarav@example.com",
  preferredLanguage: "en",
  dob: "1990-08-12T00:00:00.000Z",
  biologicalSex: "male",
  familyMembers: [
    {
      id: "f1",
      name: "Dad",
      relationship: "Father",
      biologicalSex: "male",
      dob: "1960-03-10T00:00:00.000Z"
    },
    {
      id: "f2",
      name: "Mom",
      relationship: "Mother",
      biologicalSex: "female",
      dob: "1963-07-25T00:00:00.000Z"
    }
  ],
  settings: {
    notifications: true,
    nudges: true
  }
};

export const mockReports: Report[] = [
  {
    _id: "r-001",
    reportType: "blood_test",
    reportDate: "2026-03-18T00:00:00.000Z",
    uploadDate: "2026-03-19T00:00:00.000Z",
    labName: "Sunrise Diagnostics",
    fileRef: "reports/r-001/cbc.pdf",
    language: "en",
    structuredData: [
      {
        testName: "Hemoglobin",
        value: 11.2,
        unit: "g/dL",
        normalizedValue: 11.2,
        normalizedUnit: "g/dL",
        referenceRangeLow: 13.5,
        referenceRangeHigh: 17.5,
        flag: "low"
      },
      {
        testName: "Ferritin",
        value: 18,
        unit: "ng/mL",
        normalizedValue: 18,
        normalizedUnit: "ng/mL",
        referenceRangeLow: 30,
        referenceRangeHigh: 400,
        flag: "low"
      },
      {
        testName: "Vitamin B12",
        value: 250,
        unit: "pg/mL",
        normalizedValue: 184.45,
        normalizedUnit: "pmol/L",
        referenceRangeLow: 200,
        referenceRangeHigh: 900,
        flag: "normal"
      }
    ],
    aiExplanation: {
      parameterLevel: [
        {
          parameter: "Hemoglobin",
          explanation: "Hemoglobin carries oxygen through your blood. Your value is a little below the expected range for your age and sex, which can fit with a lower iron pattern.",
          confidence: "This interpretation is straightforward."
        },
        {
          parameter: "Ferritin",
          explanation: "Ferritin reflects stored iron. A lower ferritin alongside lower hemoglobin often points toward iron stores running low rather than a one-off variation.",
          confidence: "This interpretation is fairly direct, though your doctor can add context from symptoms."
        }
      ],
      holisticSummary: "Looking at your report as a whole, the combination of lower hemoglobin and ferritin suggests a pattern worth discussing with your doctor soon, especially if you have fatigue or reduced exercise tolerance.",
      attentionScore: 3,
      confidenceNote: "The broad pattern is clear, but the cause still needs clinician context.",
      disclaimer: "This blood test interpretation is helpful for discussion, but your clinician can connect it with symptoms, diet, and exam findings."
    },
    chatHistory: [
      {
        role: "assistant",
        content: "Based on your hemoglobin of 11.2 g/dL and ferritin of 18 ng/mL, this looks like a lower-iron pattern worth discussing with your doctor.",
        timestamp: "2026-03-19T10:00:00.000Z"
      }
    ]
  },
  {
    _id: "r-002",
    reportType: "prescription",
    reportDate: "2026-03-21T00:00:00.000Z",
    uploadDate: "2026-03-21T00:00:00.000Z",
    labName: "City Clinic",
    fileRef: "reports/r-002/prescription.jpg",
    language: "en",
    structuredData: [],
    medications: [
      {
        name: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily",
        duration: "3 months",
        purpose: "Blood sugar support",
        sideEffects: ["Upset stomach", "Loose stools"],
        avoid: ["Taking on an empty stomach if it worsens nausea"],
        interactionNotes: "Metformin can be associated with lower B12 over time, which is worth checking alongside your blood reports."
      }
    ],
    aiExplanation: {
      parameterLevel: [],
      holisticSummary: "This prescription has been decoded into medication cards so you can review dosing, timing, and discussion points before your next visit.",
      attentionScore: 2,
      confidenceNote: "Handwritten prescriptions can have some ambiguity.",
      disclaimer: "This prescription explanation helps you understand the instructions, but any medication changes should stay with your doctor."
    },
    chatHistory: []
  }
];

export const mockTrends: TrendResponse = {
  reportCount: 3,
  compositeScore: [
    { date: "2025-06-18T00:00:00.000Z", score: 82 },
    { date: "2025-12-12T00:00:00.000Z", score: 76 },
    { date: "2026-03-18T00:00:00.000Z", score: 72 }
  ],
  seasonalInsights: ["Your vitamin D has dipped during cooler months across repeated yearly checks."],
  series: [
    {
      parameter: "Ferritin",
      normalizedUnit: "ng/mL",
      trendSummary: "Your ferritin has been declining steadily over 3 reports. Current level is below the normal range.",
      deltaText: "↓ 40% vs 6 months ago",
      points: [
        { date: "2025-06-18T00:00:00.000Z", value: 30, low: 30, high: 400 },
        { date: "2025-12-12T00:00:00.000Z", value: 23, low: 30, high: 400 },
        { date: "2026-03-18T00:00:00.000Z", value: 18, low: 30, high: 400 }
      ]
    },
    {
      parameter: "Hemoglobin",
      normalizedUnit: "g/dL",
      trendSummary: "Your hemoglobin has edged down across recent blood reports.",
      deltaText: "↓ 9% vs last report",
      points: [
        { date: "2025-06-18T00:00:00.000Z", value: 12.3, low: 13.5, high: 17.5 },
        { date: "2025-12-12T00:00:00.000Z", value: 11.7, low: 13.5, high: 17.5 },
        { date: "2026-03-18T00:00:00.000Z", value: 11.2, low: 13.5, high: 17.5 }
      ]
    }
  ],
  trajectories: [
    {
      parameter: "Ferritin",
      direction: "declining",
      prediction: "Ferritin may remain below range if the current pattern continues.",
      warningLevel: "watch",
      advice: "Review iron intake, symptoms, and follow-up timing with your clinician."
    }
  ]
};
