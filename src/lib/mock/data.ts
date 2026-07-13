// Mock datasets. Kept in a single file so it's easy to tweak.
import type {
  Campaign,
  TSBatch,
  TSCallRecord,
  TSForm,
  TSLead,
  TSNextLead,
  Warning,
  AuditLogEntry,
} from "../types";

export const roles = [
  { id: 3, name: "QA Agent", nameEn: "QA Agent" },
  { id: 4, name: "QA Admin", nameEn: "QA Admin" },
  { id: 5, name: "TS Agent", nameEn: "TeleSales Agent" },
  { id: 6, name: "TS Team Leader", nameEn: "TeleSales Team Leader" },
  { id: 7, name: "TS Admin", nameEn: "TeleSales Admin" },
  { id: 9, name: "Manager", nameEn: "Manager" },
];

export const callResults = [
  { id: 1, name: "Answered", nameEn: "Answered" },
  { id: 2, name: "No Answer", nameEn: "No Answer" },
  { id: 3, name: "Call Later", nameEn: "Call Later" },
  { id: 4, name: "Wrong Number", nameEn: "Wrong Number" },
];

export const transactionTypes = [
  { id: 1, name: "شراء", nameEn: "Purchase" },
  { id: 2, name: "بيع", nameEn: "Sale" },
  { id: 3, name: "استبدال", nameEn: "Exchange" },
];

export const customerStatuses = [
  { id: 1, name: "جديد", nameEn: "New" },
  { id: 2, name: "متابعة", nameEn: "Follow-up" },
  { id: 3, name: "مغلق", nameEn: "Closed" },
];

export const teamLeaders = [
  { id: 101, name: "Ahmed Hassan", fullName: "Ahmed Hassan" },
  { id: 102, name: "Mona Ali", fullName: "Mona Ali" },
  { id: 103, name: "Karim Youssef", fullName: "Karim Youssef" },
];

export const tsTeamLeaders = [
  { id: 201, name: "Hala Nabil", fullName: "Hala Nabil" },
  { id: 202, name: "Sameh Rady", fullName: "Sameh Rady" },
];

// Mock signed-in user — TS Admin so nearly all pages are reachable.
export const currentUser = {
  id: 1,
  userName: "tsadmin",
  username: "tsadmin",
  fullName: "Mock TS Admin",
  email: "tsadmin@mock.dev",
  roleId: 7,
  roleName: "TS Admin",
  teamLeaderId: null,
  isActive: true,
};

export const users = [
  { id: 1, fullName: "Mock TS Admin", email: "tsadmin@mock.dev", roleId: 7, roleName: "TS Admin", teamLeaderId: null, teamLeaderName: null, isActive: true },
  { id: 2, fullName: "Sara QA", email: "sara@mock.dev", roleId: 3, roleName: "QA Agent", teamLeaderId: 101, teamLeaderName: "Ahmed Hassan", isActive: true },
  { id: 3, fullName: "Omar QA", email: "omar@mock.dev", roleId: 3, roleName: "QA Agent", teamLeaderId: 101, teamLeaderName: "Ahmed Hassan", isActive: true },
  { id: 4, fullName: "Fady QA Admin", email: "fady@mock.dev", roleId: 4, roleName: "QA Admin", teamLeaderId: null, teamLeaderName: null, isActive: true },
  { id: 5, fullName: "Hala TS TL", email: "hala@mock.dev", roleId: 6, roleName: "TS Team Leader", teamLeaderId: null, teamLeaderName: null, isActive: true },
  { id: 6, fullName: "Sameh TS TL", email: "sameh@mock.dev", roleId: 6, roleName: "TS Team Leader", teamLeaderId: null, teamLeaderName: null, isActive: true },
  { id: 7, fullName: "Nour TS Agent", email: "nour@mock.dev", roleId: 5, roleName: "TS Agent", teamLeaderId: 201, teamLeaderName: "Hala Nabil", isActive: true },
  { id: 8, fullName: "Yasmin TS Agent", email: "yasmin@mock.dev", roleId: 5, roleName: "TS Agent", teamLeaderId: 202, teamLeaderName: "Sameh Rady", isActive: true },
  { id: 9, fullName: "Manager Ola", email: "ola@mock.dev", roleId: 9, roleName: "Manager", teamLeaderId: null, teamLeaderName: null, isActive: true },
];

export const salesReps = Array.from({ length: 18 }, (_, i) => {
  const tl = teamLeaders[i % teamLeaders.length];
  return {
    id: 200 + i,
    khaznaId: `KH-${1000 + i}`,
    fullName: `Sales Rep ${i + 1}`,
    phone: `010${String(10000000 + i).slice(-8)}`,
    whatsapp: `010${String(20000000 + i).slice(-8)}`,
    email: `rep${i + 1}@mock.dev`,
    teamLeaderId: tl.id,
    teamLeaderName: tl.fullName,
    roleId: 5,
    roleName: "Sales Rep",
    isActive: i % 7 !== 0,
  };
});

const firstNames = ["Mohamed", "Ali", "Sara", "Youssef", "Nour", "Aya", "Khaled", "Salma", "Tarek", "Dina"];
const lastNames = ["Hassan", "Ibrahim", "Fathy", "Adel", "Nabil", "Samir", "Farid", "Zaki", "Wagdy", "Anwar"];
const companies = ["Khazna", "Fawry", "Vodafone", "Etisalat", "Orange", "CIB", "NBE", "QNB"];
const statuses = ["New", "Follow-up", "Closed"];
const leadStatuses = ["Hot", "Warm", "Cold"];
const txTypes = ["Purchase", "Sale", "Exchange"];

export const customers = Array.from({ length: 40 }, (_, i) => {
  const rep = salesReps[i % salesReps.length];
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i * 3) % lastNames.length];
  return {
    CustomerId: 500 + i,
    KhaznaId: `KH-C-${2000 + i}`,
    CustomerName: `${first} ${last}`,
    Phone: `011${String(30000000 + i).slice(-8)}`,
    CompanyName: companies[i % companies.length],
    CustomerStatus: statuses[i % statuses.length],
    LeadStatus: leadStatuses[i % leadStatuses.length],
    TransactionType: txTypes[i % txTypes.length],
    SalesRepName: rep.fullName,
    TeamLeaderName: rep.teamLeaderName,
    AttemptCount: (i % 4) + 1,
    CreatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

export const calls = Array.from({ length: 30 }, (_, i) => {
  const c = customers[i % customers.length];
  const start = new Date(Date.now() - i * 3600000);
  const dur = 3 + (i % 15);
  return {
    CallId: 900 + i,
    KhaznaId: c.KhaznaId,
    CustomerName: c.CustomerName,
    CallResult: callResults[i % callResults.length].nameEn,
    StartTime: start.toISOString(),
    EndTime: new Date(start.getTime() + dur * 60000).toISOString(),
    DurationMinutes: dur,
    TotalScore: 60 + ((i * 7) % 41),
    AgentId: (i % 2) + 2,
    AgentName: users[(i % 2) + 1].fullName,
  };
});

export const evaluations = Array.from({ length: 25 }, (_, i) => {
  const c = customers[i % customers.length];
  return {
    EvaluationId: 700 + i,
    CallId: 900 + i,
    CustomerName: c.CustomerName,
    KhaznaId: c.KhaznaId,
    SalesRepName: c.SalesRepName,
    AgentName: users[(i % 2) + 1].fullName,
    TotalScore: 55 + ((i * 11) % 46),
    EvaluatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    Notes: i % 3 === 0 ? "Good rapport with customer." : "",
  };
});

export const reportSalesReps = salesReps.map((r, i) => ({
  SalesRepId: r.id,
  SalesRepName: r.fullName,
  KhaznaId: r.khaznaId,
  TeamLeaderName: r.teamLeaderName,
  TotalCalls: 20 + i,
  TotalEvaluations: 10 + (i % 8),
  AvgScore: 60 + ((i * 5) % 40),
  HighScoreCount: (i % 5) + 1,
  LowScoreCount: i % 3,
}));

export const reportAgents = users
  .filter((u) => u.roleId === 3)
  .map((u, i) => ({
    AgentId: u.id,
    AgentName: u.fullName,
    TotalCalls: 40 + i * 10,
    AnsweredCalls: 25 + i * 5,
    NoAnswerCalls: 10 + i,
    CallLaterCalls: 5 + i,
    TotalEvaluations: 20 + i * 4,
    AvgScoreGiven: 72 + i * 3,
  }));

export const reportTeams = teamLeaders.map((tl, i) => ({
  TeamLeaderId: tl.id,
  TeamLeaderName: tl.fullName,
  TotalSalesReps: salesReps.filter((r) => r.teamLeaderId === tl.id).length,
  TotalEvaluations: 30 + i * 6,
  TeamAvgScore: 68 + i * 4,
  HighScoreCount: 8 + i,
  LowScoreCount: 3 + i,
}));

export const reportBatches = Array.from({ length: 6 }, (_, i) => ({
  BatchId: 300 + i,
  BatchName: `Import Batch ${i + 1}`,
  UploadedBy: "Mock Admin",
  UploadedAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  TotalRows: 100 + i * 30,
  ValidRows: 90 + i * 25,
  DuplicateRows: 4 + i,
  ErrorRows: i,
}));

export const callLater = Array.from({ length: 5 }, (_, i) => {
  const c = customers[i];
  return {
    customerId: c.CustomerId,
    customerName: c.CustomerName,
    phone: c.Phone,
    companyName: c.CompanyName,
    transactionType: c.TransactionType,
    salesRepName: c.SalesRepName,
    scheduledAt: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
    notes: i % 2 === 0 ? "Customer requested afternoon callback" : "",
  };
});

export const evalQuestions = [
  { questionId: 1, questionText: "Did the rep greet the customer?", questionType: 1, hasComment: 0, weight: 10, sectionId: 1, sectionName: "Opening", displayOrder: 1 },
  { questionId: 2, questionText: "Did the rep verify identity?", questionType: 1, hasComment: 0, weight: 15, sectionId: 1, sectionName: "Opening", displayOrder: 2 },
  { questionId: 3, questionText: "Rate product explanation clarity (1-5)", questionType: 2, hasComment: 1, weight: 25, sectionId: 2, sectionName: "Pitch", displayOrder: 3 },
  { questionId: 4, questionText: "Was pricing communicated correctly?", questionType: 1, hasComment: 1, weight: 20, sectionId: 2, sectionName: "Pitch", displayOrder: 4 },
  { questionId: 5, questionText: "Additional notes", questionType: 3, hasComment: 1, weight: 0, sectionId: 3, sectionName: "Notes", displayOrder: 5 },
  { questionId: 6, questionText: "Did the rep close politely?", questionType: 1, hasComment: 0, weight: 30, sectionId: 3, sectionName: "Closing", displayOrder: 6 },
] as const;

export function nextLead() {
  const idx = Math.floor(Math.random() * customers.length);
  const c = customers[idx];
  const rep = salesReps.find((r) => r.fullName === c.SalesRepName) || salesReps[0];
  return {
    customerId: c.CustomerId,
    khaznaId: c.KhaznaId,
    customerName: c.CustomerName,
    phone: c.Phone,
    companyName: c.CompanyName,
    customerStatus: c.CustomerStatus,
    transactionType: c.TransactionType,
    transactionTypeId: 1,
    salesRepName: rep.fullName,
    salesRepKhaznaId: rep.khaznaId,
    attemptCount: c.AttemptCount,
    questions: evalQuestions,
  };
}

export function agentStatsSummary(scale = 1) {
  const total = Math.round(45 * scale);
  const answered = Math.round(total * 0.62);
  const unanswered = Math.round(total * 0.22);
  const wrong = Math.round(total * 0.08);
  const later = Math.max(total - answered - unanswered - wrong, 0);
  return {
    totalCalls: total,
    answeredCalls: answered,
    unansweredCalls: unanswered,
    wrongNumberCalls: wrong,
    callLaterCalls: later,
    completedEvaluations: Math.round(answered * 0.7),
    firstCallTime: "09:15",
    lastCallTime: "16:42",
    avgLeadDurationMinutes: 4.6,
    totalWorkingMinutes: 342,
  };
}

export function agentDaily(date?: string) {
  const base = date ? new Date(date).getTime() : Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const c = customers[i];
    const start = new Date(base - i * 3600000);
    const dur = 3 + (i % 12);
    return {
      callId: 800 + i,
      khaznaId: c.KhaznaId,
      customerName: c.CustomerName,
      callResult: callResults[i % callResults.length].nameEn,
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + dur * 60000).toISOString(),
      durationMinutes: dur,
      totalScore: 60 + ((i * 9) % 40),
    };
  });
}

// -------- TeleSales mocks --------

export const campaigns: Campaign[] = Array.from({ length: 4 }, (_, i) => ({
  id: 401 + i,
  name: `Campaign ${["Summer Promo", "Loyalty", "New Product", "Retention"][i]}`,
  description: "Outbound TeleSales campaign",
  startDate: new Date(Date.now() - (i + 1) * 15 * 86400000).toISOString().slice(0, 10),
  endDate: new Date(Date.now() + (5 - i) * 15 * 86400000).toISOString().slice(0, 10),
  isActive: i !== 3,
  leadsCount: 400 + i * 120,
  agentsCount: 4 + i,
  progress: 20 + i * 15,
}));

function makeForm(campaignId: number): TSForm {
  return {
    id: campaignId * 10,
    campaignId,
    name: "Default Script",
    questions: [
      { id: 1, questionText: "Is the customer interested?", questionType: "single", required: true,
        options: [
          { id: 11, optionText: "Yes" },
          { id: 12, optionText: "No" },
          { id: 13, optionText: "Maybe" },
        ] },
      { id: 2, questionText: "Interest level (1-5)", questionType: "rating", required: true },
      { id: 3, questionText: "Notes", questionType: "text", required: false },
    ],
  };
}

export const tsForms: TSForm[] = campaigns.map((c) => makeForm(c.id));

export const tsBatches: TSBatch[] = Array.from({ length: 6 }, (_, i) => {
  const c = campaigns[i % campaigns.length];
  return {
    id: 601 + i,
    campaignId: c.id,
    campaignName: c.name,
    name: `${c.name} — batch ${i + 1}`,
    uploadedBy: "Mock TS Admin",
    uploadedAt: new Date(Date.now() - i * 3 * 86400000).toISOString(),
    totalLeads: 100 + i * 25,
    processedLeads: 40 + i * 15,
    duplicateLeads: 2 + i,
    status: i === 5 ? "processing" : "ready",
  };
});

export const tsLeads: TSLead[] = Array.from({ length: 30 }, (_, i) => {
  const b = tsBatches[i % tsBatches.length];
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i * 2) % lastNames.length];
  return {
    id: 7001 + i,
    batchId: b.id,
    customerName: `${first} ${last}`,
    phone: `012${String(40000000 + i).slice(-8)}`,
    companyName: companies[i % companies.length],
    city: ["Cairo", "Alexandria", "Giza", "Mansoura"][i % 4],
    notes: i % 5 === 0 ? "VIP" : "",
    status: ["new", "in-progress", "closed"][i % 3],
    assignedAgent: users.filter((u) => u.roleId === 5)[i % 2]?.fullName,
    isReferral: i % 8 === 0,
  };
});

export function tsNextLead(campaignId?: number): TSNextLead {
  const lead = tsLeads[Math.floor(Math.random() * tsLeads.length)];
  const cid = campaignId || tsBatches.find((b) => b.id === lead.batchId)?.campaignId || campaigns[0].id;
  return {
    leadId: lead.id,
    campaignId: cid,
    campaignName: campaigns.find((c) => c.id === cid)?.name,
    customerName: lead.customerName,
    phone: lead.phone,
    companyName: lead.companyName,
    city: lead.city,
    notes: lead.notes,
    attemptCount: Math.floor(Math.random() * 3),
    form: tsForms.find((f) => f.campaignId === cid) || makeForm(cid),
  };
}

export const tsCallHistory: TSCallRecord[] = Array.from({ length: 20 }, (_, i) => {
  const lead = tsLeads[i % tsLeads.length];
  return {
    callId: 9001 + i,
    leadId: lead.id,
    customerName: lead.customerName,
    phone: lead.phone,
    callResult: callResults[i % callResults.length].nameEn!,
    callDate: new Date(Date.now() - i * 3600000).toISOString(),
    durationMinutes: 2 + (i % 10),
    agentName: users.filter((u) => u.roleId === 5)[i % 2]?.fullName,
    notes: i % 4 === 0 ? "Interested — follow up next week" : "",
  };
});

export const tsWarnings: Warning[] = Array.from({ length: 5 }, (_, i) => {
  const targets = users.filter((u) => u.roleId === 5);
  const t = targets[i % targets.length];
  return {
    id: 8001 + i,
    targetUserId: t?.id ?? 7,
    targetUserName: t?.fullName ?? "TS Agent",
    reason: ["Late to shift", "Missed calls target", "Poor call quality", "Break overrun", "Data entry"][i],
    severity: (["low", "medium", "high"] as const)[i % 3],
    status: (["open", "acknowledged", "resolved"] as const)[i % 3],
    createdBy: "Mock TS Admin",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    reply: i % 2 === 0 ? "Acknowledged — will improve" : undefined,
  };
});

export const tsAuditLog: AuditLogEntry[] = Array.from({ length: 25 }, (_, i) => {
  const u = users[i % users.length];
  const actions = ["created", "updated", "deleted", "toggled", "assigned"];
  const entities = ["Campaign", "Batch", "Lead", "User", "Warning", "Form"];
  return {
    id: 9500 + i,
    userId: u.id,
    userName: u.fullName!,
    action: actions[i % actions.length],
    entity: entities[i % entities.length],
    entityId: 100 + i,
    details: `Modified ${entities[i % entities.length]} #${100 + i}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  };
});

export function tsReportCalls(campaignId: number) {
  return tsCallHistory.map((c) => ({ ...c, campaignId }));
}

export function tsReportAgents(campaignId: number) {
  return users
    .filter((u) => u.roleId === 5)
    .map((u, i) => ({
      agentId: u.id,
      agentName: u.fullName,
      campaignId,
      totalCalls: 60 + i * 20,
      answeredCalls: 40 + i * 15,
      conversions: 10 + i * 4,
      avgCallMinutes: 3.2 + i * 0.4,
    }));
}

export function tsReportLeads(campaignId: number) {
  return tsLeads.slice(0, 20).map((l) => ({ ...l, campaignId }));
}
