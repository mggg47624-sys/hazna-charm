// Consumer Finance (CF) module — shared types & constants.

/** Mock mode is ON unless VITE_CF_MOCK is explicitly "false". */
export const CF_MOCK = import.meta.env.VITE_CF_MOCK !== "false";

export type CfStatus = 1 | 2 | 3;
export const CF_STATUS = { UnderReview: 1, Approved: 2, Rejected: 3 } as const;
export const CF_STATUS_LABEL: Record<number, string> = {
  1: "Under review",
  2: "Approved",
  3: "Rejected",
};

export const CF_CHANNELS = [
  { id: 1, name: "Universal Agent" },
  { id: 2, name: "Pickup Center" },
  { id: 3, name: "Merchant Pickup" },
];

export type CfFileType = "photo" | "idFront" | "idBack" | "contractPage2" | "contractPage3" | "contractPage4";
export const CF_FILE_SLOTS: { type: CfFileType; label: string; capture: "user" | "environment" }[] = [
  { type: "photo", label: "Customer photo", capture: "user" },
  { type: "idFront", label: "ID front", capture: "environment" },
  { type: "idBack", label: "ID back", capture: "environment" },
  { type: "contractPage2", label: "Consumer finance contract (Page 2)", capture: "environment" },
  { type: "contractPage3", label: "Customer signature on contract terms (Page 3)", capture: "environment" },
  { type: "contractPage4", label: "KYC form + promissory note (Page 4)", capture: "environment" },
];

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }

export interface CfCounts { total: number; underReview: number; approved: number; rejected: number }
export interface CfCheckResult { result: 0 | 1 | 2 | 3; registrationId?: number }
export interface CfFile { type: CfFileType; url: string }
export interface CfRejection { reasons: string[]; note?: string | null; reviewedAt?: string }

export interface CfAgentRow {
  id: number;
  customerName: string;
  createdAt: string;
  status: CfStatus;
  rejectionNote?: string | null;
  rejectionReasons?: string[];
}

export interface CfAgentRegistration {
  id: number;
  nationalId: string;
  khaznaMobile: string;
  idExpirationDate: string;
  amount: number;
  channelId: number;
  status: CfStatus;
  files: CfFile[];
  latestRejection?: CfRejection | null;
}

export interface CfAgentBreakdown {
  agentId: number; agentName: string; total: number; underReview: number; approved: number; rejected: number;
}
export interface CfChannelCount { channelId: number; channelName: string; total: number }
export interface CfTeamSummary extends CfCounts { byAgent: CfAgentBreakdown[]; byChannel: CfChannelCount[] }

export interface CfOpsDashboard { pending: number; reviewedToday: number; approvedByMe: number; rejectedByMe: number }
export interface CfQueueItem {
  id: number; customerName: string; nationalId: string; agentName: string; channelName: string; submittedAt: string;
}

export interface CfRound {
  roundNumber: number; decision: string; reasons: string[]; note?: string | null; reviewedAt: string; reviewerName: string;
}
export interface CfStatusHistory { status: CfStatus; changedAt: string; changedByName?: string }

export interface CfRegistrationDetail {
  id?: number;
  status?: CfStatus;
  list: {
    nationalId: string; customerName: string; contactNumber: string; idExpirationDate: string;
    dateOfBirth: string; approvedLimit: number; company?: string; [k: string]: unknown;
  };
  entered: {
    khaznaMobile: string; idExpirationDate: string; amount: number; channelName: string; agentName: string; createdAt: string;
  };
  files: CfFile[];
  rounds: CfRound[];
  statusHistory?: CfStatusHistory[];
}

export interface CfReason { id: number; nameAr: string }
export interface CfHistoryItem {
  id: number; registrationId: number; customerName: string; nationalId: string;
  decision: string; reasons: string[]; reviewedAt: string;
}

export interface CfAdminDashboard {
  totalCustomersInList: number; totalRegistrations: number; underReview: number; approved: number; rejected: number;
  byAgent: CfAgentBreakdown[]; byChannel: CfChannelCount[]; dailyTrend: { date: string; count: number }[];
}

export interface CfImportIssue { rowNum: number; nationalId: string; reason: string }
export interface CfImportSummary { inserted: number; updated: number; skipped: number; invalid: number; issues: CfImportIssue[] }

export interface CfBatch {
  id: number; fileName: string; uploadedByName: string; uploadedAt: string; rowsCount: number;
  insertedCount: number; updatedCount: number; skippedCount: number; invalidCount: number;
}
export interface CfAdminRegistrationRow {
  id: number; customerName: string; nationalId: string; agentName: string; channelName: string;
  amount: number; status: CfStatus; createdAt: string;
}
export interface CfCustomer {
  nationalId: string; customerName: string; company: string; contactNumber: string;
  approvedLimit: number; hasContract: boolean; batchId: number; batchName?: string;
}
