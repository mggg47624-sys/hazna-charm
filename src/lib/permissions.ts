/**
 * Role → section access, keyed by backend role IDs.
 *
 * Role IDs (per backend contract):
 *   3 = QAAgent
 *   4 = QAAdmin
 *   5 = TSAgent
 *   6 = TSTeamLeader   (management only — no call workflow)
 *   7 = TSAdmin        (management only — no call workflow)
 *   9 = Manager        (read-only across both systems)
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
  | "ts:my-warnings"
  | "manager:dashboard"
  | "manager:ts"
  | "manager:qa";

export const ROLE_QA_AGENT = 3;
export const ROLE_QA_ADMIN = 4;
export const ROLE_TS_AGENT = 5;
export const ROLE_TS_TEAM_LEADER = 6;
export const ROLE_TS_ADMIN = 7;
export const ROLE_MANAGER = 9;

// Team Leader & Admin: management only — NO ts:agent / ts:my-warnings / ts:call-history.
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
  [ROLE_TS_TEAM_LEADER]: TS_ADMIN_SECTIONS,
  [ROLE_TS_ADMIN]: TS_ADMIN_SECTIONS,
  // Manager: strictly read-only. Reports across both systems + manager sections.
  [ROLE_MANAGER]: [
    "dashboard",
    "exports",
    "manager:dashboard",
    "manager:ts",
    "manager:qa",
    "qa:reports",
    "ts:reports",
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
export function isManager(roleId?: number | null) {
  return Number(roleId) === ROLE_MANAGER;
}
