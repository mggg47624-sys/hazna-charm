export type Role = "Admin" | "QA Agent" | "TeamLeader" | "Manager" | string;

export interface CurrentUser {
  id: number;
  userName?: string;
  username?: string;
  fullName?: string;
  email: string;
  roleId: number;
  roleName?: string;
  teamLeaderId?: number | null;
  isActive?: boolean;
}

export interface Lookup {
  id: number;
  name: string;
  nameEn?: string;
}

export interface SalesRep {
  id: number;
  khaznaId: string;
  fullName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  teamLeaderId?: number | null;
  teamLeaderName?: string | null;
  isActive: boolean;
}

export interface AppUser {
  id: number;
  userName?: string;
  username?: string;
  fullName?: string;
  email: string;
  roleId: number;
  roleName?: string;
  teamLeaderId?: number | null;
  teamLeaderName?: string | null;
  isActive: boolean;
}

// ---------- QA (evaluation) ----------
export interface EvalQuestion {
  questionId: number;
  questionText: string;
  questionTextEn?: string;
  questionType: 1 | 2 | 3;
  hasComment: number;
  weight: number;
  sectionId: number;
  sectionName: string;
  displayOrder: number;
}

export interface NextLead {
  customerId: number;
  khaznaId: string;
  customerName: string;
  phone: string;
  companyName?: string;
  customerStatus?: string;
  transactionType?: string;
  transactionTypeId?: number;
  salesRepName?: string;
  salesRepKhaznaId?: string;
  attemptCount: number;
  questions: EvalQuestion[];
}

export interface CallLaterItem {
  customerId: number;
  customerName: string;
  phone: string;
  companyName?: string;
  transactionType?: string;
  salesRepName?: string;
  scheduledAt?: string;
  notes?: string;
}

export interface SubmitCallResp {
  status: string;
  callAttemptId: number;
  evaluationId: number | null;
  totalScore: number | null;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  errors?: Array<{ row: number; message: string }>;
}

// ==================== TeleSales (backend-aligned) ====================

export interface TSCampaignAgent {
  agentId: number;
  agentName: string;
  isActive: boolean;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  rootFormId?: number | null;
  createdBy?: string;
  createdAt?: string;
  totalAgents?: number;
  activeAgents?: number;
  // Kept for legacy report screens
  startDate?: string;
  endDate?: string;
  leadsCount?: number;
  agentsCount?: number;
  progress?: number;
  agents?: TSCampaignAgent[];
}

export interface TSBatchAgent {
  agentId: number;
  agentName?: string;
  maxCalls: number;
  callsUsed?: number;
}

export interface TSBatch {
  id: number;
  campaignId: number;
  campaignName?: string;
  name?: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  followUpDays?: number;
  uploadedBy?: string;
  uploadedAt: string;
  isAvailable?: boolean;
  agents?: TSBatchAgent[];
  // Legacy fields
  totalLeads?: number;
  processedLeads?: number;
  duplicateLeads?: number;
  status?: string;
}

export interface TSBatchUploadResult {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  batchId: number;
  duplicates: Array<{
    phone: string;
    fullName: string;
    company?: string;
    registrationDate?: string | null;
    activationDate?: string | null;
  }>;
}

export interface TSLead {
  id: number;
  batchId?: number;
  fullName?: string;
  customerName?: string;
  phone: string;
  company?: string;
  companyName?: string;
  city?: string;
  notes?: string;
  status?: string;
  assignedAgent?: string;
  isReferral?: boolean;
  isAvailable?: boolean;
}

// Form tree
export type TSQuestionType = 1 | 2 | 3; // 1=Options, 2=Calendar, 3=Text

export interface TSFormOption {
  id: number;
  questionId: number;
  optionText: string;
  nextFormId?: number | null;
  displayOrder?: number;
}

export interface TSFormQuestion {
  id: number;
  formId: number;
  questionText: string;
  questionType: TSQuestionType;
  nextFormId?: number | null;
  displayOrder?: number;
  options?: TSFormOption[];
  // Legacy hint
  required?: boolean;
}

export interface TSForm {
  id: number;
  campaignId: number;
  name: string;
  isRoot: boolean;
  questions: TSFormQuestion[];
}

// Queue
export interface TSNextLead {
  leadId: number;
  phone: string;
  fullName: string;
  company?: string;
  registrationDate?: string | null;
  activationDate?: string | null;
  attemptCount: number;
  followUpCount?: number;
  campaignId?: number;
  campaignName?: string;
  formId: number;
  callAttemptId: number;
  // Legacy compat
  customerName?: string;
  companyName?: string;
  city?: string;
  form?: TSForm;
}

export interface TSCallLaterItem {
  leadId: number;
  fullName: string;
  phone: string;
  companyName?: string;
  attemptCount?: number;
  lastCallAt?: string;
  lastNotes?: string;
  campaignName?: string;
}

// Answers submitted with a call
export interface TSAnswer {
  questionId: number;
  answerValue: string;
}

export interface TSSubmitCallBody {
  callAttemptId: number;
  callResultId: number;
  answersJson?: string | null;
  notes?: string;
}

export interface TSCallRecord {
  callId: number;
  leadId?: number;
  customerName?: string;
  fullName?: string;
  phone: string;
  callResult?: string;
  callResultId?: number;
  callDate: string;
  durationMinutes?: number;
  agentName?: string;
  notes?: string;
}

// Warnings
export type WarningStatus = 1 | 2 | 3; // 1=Pending, 2=Replied, 3=Closed
export type AdminAction = 1 | 2; // 1=Approve, 2=Reject

export interface Warning {
  id: number;
  agentId?: number;
  agentName?: string;
  targetUserId?: number;
  targetUserName?: string;
  campaignId?: number;
  campaignName?: string;
  reason: string;
  severity?: string;
  status: WarningStatus | string;
  note?: string;
  adminAction?: AdminAction | null;
  adminNote?: string;
  createdBy?: string;
  createdAt: string;
  reply?: string;
  minCalls?: number;
  actualCalls?: number;
  warningDate?: string;
}

// Agent Daily Report
export interface TSAgentDaily {
  agentName?: string;
  reportDate?: string;
  loginTime?: string;
  lastActionTime?: string;
  totalCalls?: number;
  completedCalls?: number;
  answeredCalls?: number;
  unansweredCalls?: number;
  callLaterCalls?: number;
  wrongNumberCalls?: number;
  notInterestedCalls?: number;
  referralsCount?: number;
  firstCallTime?: string;
  lastCallTime?: string;
  totalCallMinutes?: number;
  avgCallMinutes?: number;
  idleMinutes?: number;
  targetCalls?: number;
  targetAchieved?: boolean;
  avgLeadDurationMinutes?: number;
  totalWorkingMinutes?: number;
  calls?: Array<{
    callAttemptId: number;
    phone: string;
    leadName?: string;
    callResult?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    notes?: string;
  }>;
}

// Audit
export interface AuditLogEntry {
  id: number;
  userId?: number;
  userName: string;
  action: string;
  tableName?: string;
  entity?: string;
  recordId?: number | string;
  entityId?: number | string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  createdAt: string;
}

// Manual lead / referral
export interface Referral {
  customerName?: string;
  fullName?: string;
  phone: string;
  companyName?: string;
  company?: string;
  notes?: string;
}
