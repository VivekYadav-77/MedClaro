export type LanguageCode = "en" | "hi" | "ta" | "bn" | "te" | "mr";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  biologicalSex: string;
  dob: string;
  allergies?: MedicationAllergy[];
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

export type MedicationAllergy = {
  name: string;
  reaction?: string;
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
  prescriptionRecordId?: string;
  originalFilename?: string;
  analysisStatus?: "uploaded" | "extracting" | "analyzing" | "completed" | "failed" | "fallback_used";
  analysisMetadata?: Record<string, unknown>;
  confidence?: "high" | "medium" | "low" | string;
  fallbackUsed?: boolean;
  chatHistory: ChatMessage[];
};

export type PrescriptionStatus = "ongoing" | "completed" | "stopped" | "short_course" | "unknown";

export type PrescriptionRecord = {
  id: string;
  reportId: string;
  status: PrescriptionStatus;
  startDate?: string | null;
  endDate?: string | null;
  doctorName: string;
  specialty: string;
  notes: string;
  medications: MedicationCard[];
  prescriptionContext?: {
    doctorName?: string | null;
    specialty?: string | null;
    diagnosis?: string | null;
    doctorNotes?: string | null;
    prescriptionDate?: string | null;
    extractionConfidence?: "high" | "medium" | "low" | string | null;
  };
  report: Report;
  linkedReports: Report[];
  createdAt: string;
  updatedAt: string;
};

export type PrescriptionCandidateReport = {
  reportId: string;
  reportType: string;
  reportDate?: string | null;
  uploadDate: string;
  labName: string;
  analysisSummary: string;
  analysisStatus: "analyzed" | string;
  abnormalCount: number;
  relevanceScore: number;
  relevanceReasons: string[];
};

export type PrescriptionContextualAnalysis = {
  id: string;
  prescriptionId: string;
  selectedReportIds: string[];
  confidence: "high" | "medium" | "low";
  contextSnapshot: Record<string, unknown>;
  result: {
    likelyTreating?: string;
    reportConnections?: string[];
    medicineExplanations?: {
      medicineName: string;
      purpose?: string;
      patientExplanation?: string;
    }[];
    abnormalIndicatorsConnectedToMedicines?: {
      marker?: string;
      value?: string;
      medicineConnection?: string;
    }[];
    confidence?: "high" | "medium" | "low";
    confidenceReason?: string;
    disclaimer?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type RiskSeverity = "high" | "watch" | "info" | "none";

export type PrescriptionRiskFinding = {
  id: string;
  severity: Exclude<RiskSeverity, "none">;
  source: "local_rule" | "report_context" | "allergy" | "ai_explanation" | string;
  title: string;
  description: string;
  relatedMedicines: {
    name: string;
    dosage?: string;
    frequency?: string;
    prescriptionId?: string;
    reportId?: string;
    sourceDate?: string;
  }[];
  relatedMarkers: {
    name?: string;
    value?: number | string;
    unit?: string;
    flag?: string;
    reportId?: string;
    reportDate?: string;
  }[];
  relatedAllergies: MedicationAllergy[];
  nextStep: string;
};

export type PrescriptionRiskAnalysis = {
  profile: {
    familyMemberId?: string | null;
    name: string;
  };
  generatedAt: string;
  prescriptionCount: number;
  medicineCount: number;
  reportCount: number;
  allergies: MedicationAllergy[];
  findings: PrescriptionRiskFinding[];
  severity: RiskSeverity;
  confidence: "high" | "medium" | "low";
  summary: string;
  nextSteps: string[];
  disclaimer: string;
  inputs: {
    prescriptionIds: string[];
    reportIds: string[];
  };
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
  allergies?: MedicationAllergy[];
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
  labVariance?: {
    parameter: string;
    deltaPercent: number;
    severity: "review" | "repeat_test";
    reason?: string;
    message: string;
  }[];
  varianceFlags?: TrendResponse["labVariance"];
  guidelineNotes?: {
    parameter: string;
    category: string;
    message: string;
  }[];
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

export type CircleHealthDashboard = {
  circle: Circle;
  members: CircleMember[];
  reports: Report[];
  trends: TrendResponse;
  healthContext: HealthContext;
  feed: FeedEntry[];
  watchMarkers: {
    testName: string;
    value: number | string;
    unit: string;
    flag: "high" | "low" | "normal";
    reportId: string;
    reportDate: string;
    ownerName?: string;
    labName?: string;
  }[];
  medicationSummary: {
    medicationCount: number;
    hasPrescription: boolean;
  };
  emergencyEvents: {
    id: string;
    eventType: string;
    actorName: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }[];
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
  deltaFromPrevious?: string | null;
  risk: "normal" | "watch" | "high";
  sourceConfidence?: string;
};

export type ScreeningTask = {
  id?: string;
  title: string;
  dueStatus: "due" | "upcoming" | "not_applicable" | "needs_profile" | "done" | "deferred";
  status?: "due" | "upcoming" | "not_applicable" | "needs_profile" | "done" | "deferred";
  dueDate?: string | null;
  reason: string;
  actionLabel: string;
};

export type RemissionPathway = {
  id?: string;
  condition: "prediabetes" | "fatty_liver" | "hypertension" | "general";
  status: FeatureStatus | "active" | "completed" | "paused";
  progressPercent: number;
  currentWeek: number;
  nextHabit: string;
  weeklyHabits?: string[];
  markerGoals?: string[];
};
