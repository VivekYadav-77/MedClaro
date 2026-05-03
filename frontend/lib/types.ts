export type LanguageCode = "en" | "hi" | "ta" | "bn" | "te" | "mr";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  biologicalSex: string;
  dob: string;
};

export type Parameter = {
  testName: string;
  value: number | string;
  unit: string;
  normalizedValue?: number | null;
  normalizedUnit?: string | null;
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  flag: "high" | "low" | "normal";
};

export type ReportExplanation = {
  parameterLevel: { parameter: string; explanation: string; confidence: string }[];
  holisticSummary: string;
  attentionScore: number;
  confidenceNote: string;
  disclaimer: string;
};

export type MedicationCard = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string;
  sideEffects: string[];
  avoid: string[];
  interactionNotes: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type Report = {
  _id: string;
  reportType: string;
  reportDate: string;
  uploadDate: string;
  labName: string;
  fileRef: string;
  language: LanguageCode;
  structuredData: Parameter[];
  aiExplanation: ReportExplanation;
  medications?: MedicationCard[];
  chatHistory: ChatMessage[];
};

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
  preferredLanguage: LanguageCode;
  dob: string;
  biologicalSex: string;
  familyMembers: FamilyMember[];
  settings: {
    notifications: boolean;
    nudges: boolean;
  };
};

export type TrendSeries = {
  parameter: string;
  normalizedUnit: string;
  trendSummary: string;
  deltaText: string;
  points: { date: string; value: number; low?: number | null; high?: number | null }[];
};

export type TrendResponse = {
  reportCount: number;
  compositeScore: { date: string; score: number }[];
  seasonalInsights: string[];
  series: TrendSeries[];
};
