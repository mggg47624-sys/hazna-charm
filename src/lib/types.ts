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

// -------- TeleSales domain --------

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  leadsCount?: number;
  agentsCount?: number;
  progress?: number;
}

export interface TSFormOption {
  id: number;
  optionText: string;
  optionValue?: string;
  displayOrder?: number;
}

export interface TSFormQuestion {
  id: number;
  questionText: string;
  questionType: "text" | "single" | "multi" | "rating";
  required: boolean;
  options?: TSFormOption[];
  displayOrder?: number;
}

export interface TSForm {
  id: number;
  campaignId: number;
  name: string;
  questions: TSFormQuestion[];
}

export interface TSBatch {
  id: number;
  campaignId: number;
  campaignName?: string;
  name: string;
  uploadedBy?: string;
  uploadedAt: string;
  totalLeads: number;
  processedLeads: number;
  duplicateLeads: number;
  status: string;
}

export interface TSLead {
  id: number;
  batchId: number;
  customerName: string;
  phone: string;
  companyName?: string;
  city?: string;
  notes?: string;
  status?: string;
  assignedAgent?: string;
  isReferral?: boolean;
}

export interface TSNextLead {
  leadId: number;
  campaignId: number;
  campaignName?: string;
  customerName: string;
  phone: string;
  companyName?: string;
  city?: string;
  notes?: string;
  attemptCount: number;
  form: TSForm;
}

export interface TSCallRecord {
  callId: number;
  leadId: number;
  customerName: string;
  phone: string;
  callResult: string;
  callDate: string;
  durationMinutes?: number;
  agentName?: string;
  notes?: string;
}

export interface Warning {
  id: number;
  targetUserId: number;
  targetUserName: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "open" | "acknowledged" | "resolved";
  createdBy: string;
  createdAt: string;
  reply?: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entity: string;
  entityId?: number | string;
  details?: string;
  createdAt: string;
}

export interface Referral {
  customerName: string;
  phone: string;
  companyName?: string;
  notes?: string;
}
