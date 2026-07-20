/**
 * Role → section access, keyed by backend role IDs.
 *
 * Role IDs (per backend contract):
 *   3 = QAAgent
 *   4 = QAAdmin
 *   5 = TSAgent
 *   6 = TSTeamLeader   (reports only)
 *   7 = TSAdmin        (full TeleSales admin)
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
  | "ts:admin-forms"
  | "ts:admin-config"
  | "ts:admin-dumps"
  | "ts:reports"
  | "ts:warnings"
  | "ts:audit"
  | "ts:my-warnings"
  | "ts:daily-stats"
  | "manager:dashboard"
  | "manager:ts"
  | "manager:qa";

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
  "ts:admin-forms",
  "ts:admin-config",
  "ts:admin-dumps",
  "ts:reports",
  "ts:warnings",
  "ts:audit",
  "ts:daily-stats",
];

// Team Leader → same access as TS Admin
const TS_TEAM_LEADER_SECTIONS: Section[] = TS_ADMIN_SECTIONS;

export const ROLE_PERMISSIONS: Record<number, Section[]> = {
  [ROLE_QA_AGENT]: ["qa:agent", "qa:call-history"],
  [ROLE_QA_ADMIN]: ["dashboard", "exports", "qa:admin", "qa:reports"],
  [ROLE_TS_AGENT]: ["ts:agent", "ts:call-history", "ts:my-warnings"],
  [ROLE_TS_TEAM_LEADER]: TS_TEAM_LEADER_SECTIONS,
  [ROLE_TS_ADMIN]: TS_ADMIN_SECTIONS,
  [ROLE_MANAGER]: [
    "dashboard",
    "exports",
    "manager:dashboard",
    "manager:ts",
    "manager:qa",
    "qa:reports",
    "ts:reports",
    "ts:daily-stats",
  ],
};

export function permissionsFor(roleId: number | undefined | null): Section[] {
  if (!roleId) return [];
  return ROLE_PERMISSIONS[Number(roleId)] ?? [];
}

export function canAccess(roleId: number | undefined | null, section: Section): boolean {
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

export const isQaAgent = (roleId?: number | null) => Number(roleId) === ROLE_QA_AGENT;
export const isTsAgent = (roleId?: number | null) => Number(roleId) === ROLE_TS_AGENT;
export const isAgent = (roleId?: number | null) => isQaAgent(roleId) || isTsAgent(roleId);
export const isManager = (roleId?: number | null) => Number(roleId) === ROLE_MANAGER;
