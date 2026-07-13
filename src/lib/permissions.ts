/**
 * Role → section access, keyed by backend role IDs.
 *
 * Role IDs (per backend contract):
 *   3 = QAAgent
 *   4 = QAAdmin
 *   5 = TSAgent
 *   6 = TSTeamLeader   (has full TSAdmin capabilities)
 *   7 = TSAdmin
 *   9 = Manager        (read-only across both systems)
 *
 * Section keys are grouped by system:
 *   dashboard         — landing dashboard (all non-agent roles)
 *   exports           — CSV / Excel export button on admin & report tables
 *
 *   qa:agent          — QA agent work queue + call later
 *   qa:call-history   — QA agent personal call history
 *   qa:admin          — QA admin (users, sales reps, import)
 *   qa:reports        — QA reports (customers, sales reps, evaluations, batches,
 *                        calls, agents, teams)
 *
 *   ts:agent          — TS agent work queue + call later
 *   ts:call-history   — TS agent personal call history
 *   ts:admin          — TS admin (campaigns, forms, batches, users)
 *   ts:reports        — TS reports (per campaign)
 *   ts:warnings       — TS warnings admin
 *   ts:audit          — TS audit log
 *   ts:my-warnings    — TS agent's own warnings page
 */

export type Section =
  | "dashboard"
  | "exports"
  | "qa:agent"
  | "qa:call-history"
  | "qa:admin"
  | "qa:reports"
  | "ts:agent"
  | "ts:call-history"
  | "ts:admin"
  | "ts:reports"
  | "ts:warnings"
  | "ts:audit"
  | "ts:my-warnings";

export const ROLE_QA_AGENT = 3;
export const ROLE_QA_ADMIN = 4;
export const ROLE_TS_AGENT = 5;
export const ROLE_TS_TEAM_LEADER = 6;
export const ROLE_TS_ADMIN = 7;
export const ROLE_MANAGER = 9;

const TS_ADMIN_SECTIONS: Section[] = [
  "dashboard",
  "exports",
  "ts:admin",
  "ts:reports",
  "ts:warnings",
  "ts:audit",
];

export const ROLE_PERMISSIONS: Record<number, Section[]> = {
  [ROLE_QA_AGENT]: ["qa:agent", "qa:call-history"],
  [ROLE_QA_ADMIN]: [
    "dashboard",
    "exports",
    "qa:admin",
    "qa:reports",
  ],
  [ROLE_TS_AGENT]: ["ts:agent", "ts:call-history", "ts:my-warnings"],
  // Team leader shares TS admin capabilities per business contract.
  [ROLE_TS_TEAM_LEADER]: TS_ADMIN_SECTIONS,
  [ROLE_TS_ADMIN]: TS_ADMIN_SECTIONS,
  // Manager: read-only across both systems.
  [ROLE_MANAGER]: [
    "dashboard",
    "exports",
    "qa:reports",
    "ts:reports",
    "ts:warnings",
    "ts:audit",
  ],
};

export function permissionsFor(roleId: number | undefined | null): Section[] {
  if (!roleId) return [];
  return ROLE_PERMISSIONS[Number(roleId)] ?? [];
}

export function canAccess(
  roleId: number | undefined | null,
  section: Section,
): boolean {
  return permissionsFor(roleId).includes(section);
}

/** Friendly labels, falling back to backend-provided role name. */
export const ROLE_LABELS: Record<number, string> = {
  [ROLE_QA_AGENT]: "QA Agent",
  [ROLE_QA_ADMIN]: "QA Admin",
  [ROLE_TS_AGENT]: "TeleSales Agent",
  [ROLE_TS_TEAM_LEADER]: "TeleSales Team Leader",
  [ROLE_TS_ADMIN]: "TeleSales Admin",
  [ROLE_MANAGER]: "Manager",
};

export function isQaAgent(roleId?: number | null) {
  return Number(roleId) === ROLE_QA_AGENT;
}
export function isTsAgent(roleId?: number | null) {
  return Number(roleId) === ROLE_TS_AGENT;
}
export function isAgent(roleId?: number | null) {
  return isQaAgent(roleId) || isTsAgent(roleId);
}
