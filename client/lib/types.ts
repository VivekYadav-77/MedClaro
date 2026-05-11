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
  lifestyleCorrelation?: {
    correlations: {
      note: string;
      relatedMarkers: string[];
      impact: "positive" | "neutral" | "negative";
      message: string;
    }[];
    overallMessage: string;
  };
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

export type Reminder = {
  _id: string;
  userId?: string;
  reportId: string;
  reminderDate: string;
  sent: boolean;
  muted: boolean;
};

export type Report = {
  _id: string;
  userId?: string;
  ownerName?: string;
  familyMemberId?: string | null;
  familyMemberName?: string | null;
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

export type ReportShare = {
  id: string;
  circleId: string;
  circleName: string;
  status: "active" | "revoked";
  accessLevel: "view";
  sharedBy: string;
  consentGrantedBy: string;
  createdAt: string;
  revokedAt?: string | null;
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
  trajectories: {
    parameter: string;
    direction: "improving" | "declining" | "stable";
    prediction: string;
    warningLevel: "none" | "watch" | "alert";
    advice: string;
  }[];
};

export type Circle = {
  id: string;
  name: string;
  createdBy?: string;
  memberCount: number;
  myRole: "admin" | "caregiver" | "viewer";
  joinCode?: string;
};

export type CircleMember = {
  id: string;
  userId: string;
  name: string;
  role: "admin" | "caregiver" | "viewer";
  joinedAt: string;
};

export type FeedEntry = {
  id: string;
  eventType: string;
  actorName: string;
  payload: Record<string, unknown>;
  createdAt: string;
  reactionCount?: number;
  userHasReacted?: boolean;
};

export type AppNotification = {
  id: string;
  read: boolean;
  feedEntry: FeedEntry;
  createdAt: string;
};

export type HealthContext = {
  reportCount: number;
  activeMedicationCount: number;
  watchMarkerCount: number;
  medications: {
    name?: string;
    dosage?: string;
    frequency?: string;
    purpose?: string;
    sourceDate?: string;
  }[];
  watchMarkers: Parameter[];
  reports: {
    owner?: string;
    familyMember?: string | null;
    type: string;
    date: string;
    abnormalMarkers: { name: string; value: number | string; unit: string; flag: string }[];
    medications: string[];
    summary: string;
  }[];
};

export type FeatureStatus = "live" | "needs_setup" | "backend_pending" | "no_data";

export type ClinicalFeatureCard = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  status: FeatureStatus;
  route?: string;
  actionLabel: string;
  category: "safety" | "clinical" | "daily" | "integration" | "care";
};

export type EmergencySosState = {
  status: FeatureStatus;
  adminRecipients: number;
  locationPermission: "unknown" | "granted" | "denied" | "unsupported";
  smsProviderConnected: boolean;
};

export type EhrExportRow = {
  marker: string;
  value: number | string;
  unit: string;
  loincCode?: string;
  delta?: string;
  risk: "normal" | "watch" | "high";
};

export type MedicationRiskSummary = {
  medicationCount: number;
  polypharmacyRisk: "low" | "moderate" | "high";
  anticholinergicBurdenStatus: FeatureStatus;
  refillPrompts: string[];
};

export type ScreeningTask = {
  title: string;
  dueStatus: "due" | "upcoming" | "not_applicable" | "needs_profile";
  reason: string;
  actionLabel: string;
};

export type RemissionPathway = {
  condition: "prediabetes" | "fatty_liver" | "hypertension";
  status: FeatureStatus;
  progressPercent: number;
  currentWeek: number;
  nextHabit: string;
};
