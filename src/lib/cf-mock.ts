// In-memory sample data for CF mock mode (VITE_CF_MOCK !== "false").
import {
  CF_CHANNELS, CF_FILE_SLOTS,
  type CfAgentBreakdown, type CfChannelCount, type CfCustomer, type CfFile, type CfRound, type CfStatus,
  type CfStatusHistory, type CfBatch, type CfReason, type CfHistoryItem,
} from "./cf-types";

const NAMES = [
  "أحمد محمد علي", "منى حسن إبراهيم", "محمود سعيد عبد الله", "فاطمة السيد أحمد", "يوسف خالد مصطفى",
  "نورهان عادل فتحي", "كريم طارق حسين", "سارة عمرو سامي", "عمر ياسر محمود", "هدى رمضان علي",
  "مصطفى جمال عبده", "ريهام وليد أنور",
];
const COMPANIES = ["شركة النيل للتجارة", "مصنع الدلتا", "Cairo Logistics", "مجموعة الأهرام"];
export const MOCK_AGENTS = [
  { id: 101, name: "إسلام حمدي" }, { id: 102, name: "شيماء عصام" },
  { id: 103, name: "Hany Fawzy" }, { id: 104, name: "دينا مجدي" },
];
export const MOCK_AGENT_ID = 101;
export const MOCK_REASONS: CfReason[] = [
  { id: 1, nameAr: "التوقيع غير مطابق" }, { id: 2, nameAr: "صورة البطاقة غير واضحة" },
  { id: 3, nameAr: "رقم الموبايل غير مطابق" }, { id: 4, nameAr: "المبلغ أكبر من الحد المسموح" },
  { id: 5, nameAr: "صفحة العقد ناقصة" },
];

const pad = (n: number, l = 2) => String(n).padStart(l, "0");
export const mockNid = (i: number) => `29${i % 10}${pad((i % 9) + 1)}${pad(10 + (i % 18))}0101${pad(i, 3)}`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const dateOnly = (iso: string) => iso.slice(0, 10);

export function placeholderImage(label: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560"><rect width="100%" height="100%" fill="hsl(${hue},35%,88%)"/><rect x="30" y="30" width="740" height="500" rx="24" fill="none" stroke="hsl(${hue},35%,45%)" stroke-width="4" stroke-dasharray="14 10"/><text x="50%" y="48%" font-family="sans-serif" font-size="38" text-anchor="middle" fill="hsl(${hue},35%,30%)">${label}</text><path d="M260 400 q60 -60 120 0 t120 0" stroke="hsl(${hue},40%,30%)" stroke-width="5" fill="none"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const mockFiles = (seed: number): CfFile[] =>
  CF_FILE_SLOTS.map((s, k) => ({ type: s.type, url: placeholderImage(s.label.split(" (")[0], (seed * 40 + k * 55) % 360) }));

export interface MockReg {
  id: number; nationalId: string; agentId: number; channelId: number; khaznaMobile: string;
  idExpirationDate: string; amount: number; status: CfStatus; createdAt: string;
  files: CfFile[]; rounds: CfRound[]; statusHistory: CfStatusHistory[];
}

const store = {
  customers: [] as (CfCustomer & { eligibilityResult?: 4 | 5 | 6 })[],
  regs: [] as MockReg[],
  history: [] as CfHistoryItem[],
  batches: [] as CfBatch[],
};
let initialized = false;
export const db = {
  get customers() { initialize(); return store.customers; },
  get regs() { initialize(); return store.regs; },
  get history() { initialize(); return store.history; },
  get batches() { initialize(); return store.batches; },
};

function initialize() {
  if (initialized) return;
  initialized = true;

// Eligibility list: 30 customers in 2 batches
for (let i = 0; i < 30; i++) {
  db.customers.push({
    nationalId: mockNid(i), customerName: NAMES[i % NAMES.length], company: COMPANIES[i % COMPANIES.length],
    contactNumber: `010${pad(1000000 + i * 3791, 8)}`, approvedLimit: 5000 + (i % 6) * 2500,
    hasContract: i < 18, batchId: i < 20 ? 1 : 2, batchName: i < 20 ? "customers_oct.xlsx" : "customers_nov.xlsx",
  });
}
for (const [i, result] of [[30, 4], [31, 5], [32, 6]] as const) {
  db.customers.push({
    nationalId: mockNid(i), customerName: NAMES[i % NAMES.length], company: COMPANIES[i % COMPANIES.length],
    contactNumber: `010${pad(1000000 + i * 3791, 8)}`, approvedLimit: 5000,
    hasContract: false, batchId: 2, batchName: "customers_nov.xlsx", eligibilityResult: result,
  });
}
db.batches.push(
  { id: 1, fileName: "customers_oct.xlsx", uploadedByName: "Admin CF", uploadedAt: daysAgo(20), rowsCount: 23, insertedCount: 20, updatedCount: 0, skippedCount: 1, invalidCount: 2 },
  { id: 2, fileName: "customers_nov.xlsx", uploadedByName: "Admin CF", uploadedAt: daysAgo(4), rowsCount: 12, insertedCount: 10, updatedCount: 1, skippedCount: 0, invalidCount: 1 },
);

// Registrations for the first 18 customers
for (let i = 0; i < 18; i++) {
  const c = db.customers[i];
  const status = ([1, 2, 3] as CfStatus[])[i % 3];
  const created = daysAgo(18 - i);
  const rounds: CfRound[] = [];
  const statusHistory: CfStatusHistory[] = [{ status: 1, changedAt: created, changedByName: MOCK_AGENTS[i % 4].name }];
  if (status !== 1) {
    const rej = status === 3;
    rounds.push({
      roundNumber: 1, decision: rej ? "reject" : "approve",
      reasons: rej ? [MOCK_REASONS[i % 5].nameAr, MOCK_REASONS[(i + 2) % 5].nameAr] : [],
      note: rej ? "برجاء إعادة تصوير صفحة التوقيع بوضوح" : null,
      reviewedAt: daysAgo(17 - i), reviewerName: "Ops Reviewer",
    });
    statusHistory.push({ status, changedAt: daysAgo(17 - i), changedByName: "Ops Reviewer" });
  }
  db.regs.push({
    id: 1001 + i, nationalId: c.nationalId, agentId: MOCK_AGENTS[i % 4].id, channelId: (i % 3) + 1,
    khaznaMobile: i % 4 === 0 ? "01198765432" : c.contactNumber,
    idExpirationDate: i % 5 === 1 ? "2029-01-01" : "2030-06-30",
    amount: i % 5 === 0 ? c.approvedLimit + 1500 : c.approvedLimit,
    status, createdAt: created, files: mockFiles(i), rounds, statusHistory,
  });
  if (status !== 1) {
    db.history.push({
      id: 5000 + i, registrationId: 1001 + i, customerName: c.customerName, nationalId: c.nationalId,
      decision: rounds[0].decision, reasons: rounds[0].reasons, reviewedAt: rounds[0].reviewedAt,
    });
  }
}

}

export const customerOf = (r: MockReg) => {
  const customer = db.customers.find((c) => c.nationalId === r.nationalId);
  if (!customer) throw new Error("Customer not found");
  return customer;
};
export const agentName = (id: number) => MOCK_AGENTS.find((a) => a.id === id)?.name ?? "—";
export const channelName = (id: number) => CF_CHANNELS.find((c) => c.id === id)?.name ?? "—";
export const listExpiry = (r: MockReg) => "2030-06-30" + (r ? "" : "");

export function regDetail(r: MockReg) {
  const c = customerOf(r);
  const y = (c.nationalId[0] === "2" ? 1900 : 2000) + Number(c.nationalId.slice(1, 3));
  return {
    id: r.id, status: r.status,
    list: {
      nationalId: c.nationalId, customerName: c.customerName, contactNumber: c.contactNumber,
      idExpirationDate: listExpiry(r), dateOfBirth: `${y}-${c.nationalId.slice(3, 5)}-${c.nationalId.slice(5, 7)}`,
      approvedLimit: c.approvedLimit, company: c.company,
    },
    entered: {
      khaznaMobile: r.khaznaMobile, idExpirationDate: r.idExpirationDate, amount: r.amount,
      channelName: channelName(r.channelId), agentName: agentName(r.agentId), createdAt: r.createdAt,
    },
    files: r.files, rounds: r.rounds, statusHistory: r.statusHistory,
  };
}

export function counts(regs: MockReg[]) {
  return {
    total: regs.length,
    underReview: regs.filter((r) => r.status === 1).length,
    approved: regs.filter((r) => r.status === 2).length,
    rejected: regs.filter((r) => r.status === 3).length,
  };
}
export function byAgent(regs: MockReg[]): CfAgentBreakdown[] {
  return MOCK_AGENTS.map((a) => ({ agentId: a.id, agentName: a.name, ...counts(regs.filter((r) => r.agentId === a.id)) }));
}
export function byChannel(regs: MockReg[]): CfChannelCount[] {
  return CF_CHANNELS.map((c) => ({ channelId: c.id, channelName: c.name, total: regs.filter((r) => r.channelId === c.id).length }));
}
export function inRange(iso: string, from?: string, to?: string) {
  const d = dateOnly(iso);
  return (!from || d >= from) && (!to || d <= to);
}
export function page<T>(items: T[], p = 1, pageSize = 10) {
  return { items: items.slice((p - 1) * pageSize, p * pageSize), total: items.length, page: p, pageSize };
}
export const filesFromForm = (fd: FormData, prev: CfFile[]): CfFile[] =>
  CF_FILE_SLOTS.map((s) => {
    const f = fd.get(s.type);
    return f instanceof File ? { type: s.type, url: URL.createObjectURL(f) } : prev.find((p) => p.type === s.type) ?? { type: s.type, url: "" };
  });
