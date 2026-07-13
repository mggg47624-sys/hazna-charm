# Unified QA + TeleSales Portal

Goal: نضم سيستم TeleSales الجديد جنب سيستم QA في نفس الواجهة، مع Roles جديدة، Dashboard خاصة لكل Role، Call History للـ QA/TS Agent، وأدوات إدارية موسّعة (Batches, Exports, Referral, Copy phone).

---

## 1) Auth & API base

- `src/lib/api.ts`: endpoints جديدة `/api/auth/Login`, `/api/users/me`, `/api/users/change-password`, `/api/users/*`.
- `src/lib/auth.tsx`: يستخدم `/api/users/me`.
- `src/lib/lookups.ts`: تحديث المسارات الصحيحة من الـ swagger + إضافة `useTSTeamLeaders`.

## 2) Roles & Permissions (بالـ IDs)

`src/lib/permissions.ts` يتعاد كتابته على أساس role IDs:

| ID | Role | Sections |
|----|------|----------|
| 3 | QAAgent | `qa:agent`, `qa:call-history` |
| 4 | QAAdmin | `qa:admin`, `qa:reports`, `dashboard`, `exports` |
| 5 | TSAgent | `ts:agent`, `ts:call-history` |
| 6 | TSTeamLeader | **نفس صلاحيات TSAdmin** (batches upload/assign, campaigns, forms, users, warnings, audit log, reports, exports) + `dashboard` |
| 7 | TSAdmin | `ts:admin`, `ts:reports`, `ts:warnings`, `ts:audit`, `dashboard`, `exports` |
| 9 | Manager | كل الـ reports للسيستمين + `dashboard` + `exports` (read-only) |

`useCanAccess(section)` + `useRoleId()` من `users/me`.

## 3) Sidebar / Navigation

`src/components/app-sidebar.tsx` — grouping حسب الصلاحيات:

- **Overview**: Dashboard
- **QA — Workspace** (QAAgent): Work Queue, Call Later, Call History
- **QA — Administration** (QAAdmin): Users, Sales Reps, Import
- **QA — Reports** (QAAdmin/Manager): Customers, Sales Reps, Evaluations, Batches, Calls, QA Agents, Teams
- **TeleSales — Workspace** (TSAgent): Work Queue, Call Later, Call History, My Warnings
- **TeleSales — Administration** (TSAdmin/**TSTeamLeader**): Campaigns, Forms, Batches, Users, Warnings, Audit Log
- **TeleSales — Reports** (TSAdmin/TSTeamLeader/Manager): Calls, Agents, Leads (per campaign)

## 4) Route tree additions

Under `src/routes/_authenticated/`:

```
qa.work.tsx / qa.call-later.tsx / qa.call-history.tsx  (جديد)
qa.admin.{users,sales-reps,import}.tsx
qa.reports.*.tsx  (نقل الحالي)

ts.work.tsx / ts.call-later.tsx / ts.call-history.tsx / ts.my-warnings.tsx
ts.admin.campaigns.tsx / ts.admin.campaigns.$id.tsx
ts.admin.forms.$campaignId.tsx
ts.admin.batches.tsx / ts.admin.batches.$id.tsx
ts.admin.users.tsx / ts.admin.warnings.tsx / ts.admin.audit-log.tsx
ts.reports.calls.$campaignId.tsx / ts.reports.agents.$campaignId.tsx / ts.reports.leads.$campaignId.tsx
```

Redirects للـ `/agent/*` و `/reports/*` القديمة عشان مفيش روابط تتكسر.

## 5) Dashboards (per role)

`_authenticated/index.tsx` يوزّع حسب `roleId`. كلها بنفس نمط KpiCard + Recharts:

- **QAAgent** → redirect لـ `/qa/work`.
- **QAAdmin** — Total Calls, Answer Rate, Evaluations, Avg Score + charts (calls trend, results pie, top reps).
- **TSAgent** — Today/Month KPIs (calls, answered, wrong number, call-later, working minutes, avg lead duration) + line chart calls/day + آخر مكالمات + عدد warnings.
- **TSTeamLeader** — team KPIs (agents, calls today, conversion, avg score) + top agents + campaign progress + open warnings.
- **TSAdmin** — system KPIs (campaigns active, agents active, leads total, conversion) + calls trend + per-campaign progress + open warnings.
- **Manager** — overview موحد للسيستمين side-by-side.

## 6) Call History pages

- `/qa/call-history` — QAAgent: history of calls للـ agent الحالي من `/api/Report/Calls` مفلترة + link للـ evaluation.
- `/ts/call-history` — TSAgent: history من `/api/ts/Report/Calls/{campaignId}` مفلترة، مع اختيار campaign.

## 7) TeleSales workspace details

`/ts/work` = TS NextLead بشكل مشابه لـ `agent.work.tsx`:

- `GET /api/ts/Queue/NextLead` → عرض بيانات الليد + الفورم الديناميكي من `/api/ts/Form/ByCampaign/{campaignId}`.
- **زرار "Copy" (Copy icon من lucide) جنب رقم الهاتف** — `navigator.clipboard.writeText(phone)` + toast تأكيد.
- **زرار "Add Referral"** جنب الـ actions → يفتح Dialog (اسم، تليفون، ملاحظات) → `POST /api/ts/Queue/addReferral` → toast + `queryClient.invalidateQueries` للـ leads.
- Submit على `/api/ts/Queue/Submit`، Call Later على `/api/ts/Queue/CallLater`.

## 8) Exports (للـ admins/team-leader/manager)

Reusable `ExportButton` component (`src/components/export-button.tsx`) بيصدّر أي جدول لـ **CSV** و **Excel** (via `xlsx`) client-side. يظهر في:

- QA Reports: Customers, Sales Reps, Evaluations, Batches, Calls, Agents, Teams.
- TS Reports: Calls, Agents, Leads (per campaign).
- TS Admin: Campaigns list, Batches list, Batch leads, Users, Warnings, Audit Log.
- QA Admin: Users, Sales Reps list.

الزرار يستخدم `useCanAccess("exports")` عشان يظهر لـ Admins/TSTeamLeader/Manager فقط.

## 9) Technical notes

- Hooks جديدة في `src/lib/ts-*.ts` (agent-stats, campaigns, forms, batches, warnings, reports, referral).
- Types جديدة في `src/lib/types.ts`: `Campaign`, `TSForm`, `TSBatch`, `TSLead`, `Warning`, `AuditLogEntry`, `Referral`.
- `SectionGuard` على كل صفحة جديدة.
- Mocks في `src/lib/mock/router.ts` لكل الـ endpoints الجديدة عشان dev mode يفضل يشتغل.
- Toaster موجود بالفعل — نستخدمه للـ copy/referral confirmations.

## 10) Out of scope

- تعديل الباكاند.
- i18n شامل.
- Realtime updates.

---

## Deliverables

1. Auth/api/lookups محدّثة.
2. Permissions موحّدة بالـ role IDs + TSTeamLeader = TSAdmin.
3. Sidebar جديدة بالتجميع أعلاه.
4. Route tree جديد + redirects.
5. 6 dashboards role-based بنفس السـتايل.
6. QA + TS Call History pages.
7. TS admin شامل (Campaigns/Forms/Batches/Users/Warnings/AuditLog).
8. TS reports (Calls/Agents/Leads per campaign).
9. Export CSV/Excel لكل الجداول الإدارية.
10. TS Agent Work page: Copy-phone icon + Add Referral dialog.
11. Mocks للـ dev.
