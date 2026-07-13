# Milestone 2 — Workflow Corrections

Scope: agent workflow parity, remove call pages from Team Leader / Admin, Reply-to-warning, reusable report filters, and a read-only Manager dashboard split into TS/QA sections. No backend or dependency changes.

---

## Step 1 — Permissions + sidebar guards

**`src/lib/permissions.ts`**
- Role 6 (TSTeamLeader): remove `ts:agent`, `ts:my-warnings`, `ts:call-history`. Keep `ts:admin`, `ts:reports`, `ts:warnings`, `ts:audit`, `dashboard`, `exports`.
- Role 7 (TSAdmin): remove `ts:agent`, `ts:my-warnings`, `ts:call-history`. Keep admin/reports/exports.
- Role 9 (Manager): add `manager:dashboard`, `manager:ts`, `manager:qa`. Grant every QA & TS **report** section + `exports`. Explicitly deny every write/agent section.

**`src/components/app-sidebar.tsx`**
- TeleSales Workspace group (Work Queue / Call Later / Call History / My Warnings) rendered only when `useIsTsAgent()` (role 5).
- QA Workspace group already gated by `useIsQaAgent()` — verify.
- New Manager group visible only when `roleId === 9` (populated in Step 5).

`SectionGuard` on each page already blocks direct-URL access once permissions are trimmed.

---

## Step 2 — QA Work Queue rebuild + QA Call Later pickup

**`src/routes/_authenticated/qa.work.tsx`** — mirror `ts.work.tsx` shape:
- **Get Next Lead** button → mutation on `POST /api/Queue/Next`.
- On mount, if `queryClient.getQueryData(["queue","next"])` exists, render it instead of prompting Get Next (Call Later hand-off).
- Renders: Customer card, Call Result `<Select>` (from lookups), Dynamic Form (when backend returns `dynamicForm`), Notes, **Submit Call** → existing evaluation submit endpoint.

**`src/routes/_authenticated/qa.call-later.tsx`**
- Rename action to **Pick Up**.
- On `POST /api/Queue/PickFromCallLater/{customerId}` success:
  ```ts
  queryClient.setQueryData(["queue","next"], lead);
  navigate({ to: "/qa/work" });
  ```
- Work Queue skips its own fetch when cache is primed.

---

## Step 3 — TS Work cleanup + TS Call Later pickup + Warning Reply

**`src/routes/_authenticated/ts.work.tsx`**
- Remove Campaign Type `<Select>` and every `campaignType` reference.
- `useTsNextLead()` invoked with no arg.
- Layout: Get Next Lead → Customer Details, Operation Type, Call Result, Dynamic Form, Notes, Submit Call.
- Same cache-first pattern as QA (`["ts","next"]`).

**`src/routes/_authenticated/ts.call-later.tsx`**
- Add **Pick Up** column/button.
- New hook `useTsPickCallLater(id)` in `src/lib/ts-api.ts` → `POST /api/ts/Queue/PickCallLater/{id}`.
- On success: seed `["ts","next"]`, navigate to `/ts/work`.

**`src/routes/_authenticated/ts.my-warnings.tsx`**
- Add Actions column. When `w.reply` is empty → **Reply** button opens a shadcn `Dialog` with `Textarea` + Save.
- Uses existing `useReplyWarning`. On success:
  - Hide the Reply button.
  - Row shows `<Badge>Replied</Badge>` and reply text + timestamp.
- Server-enforced single reply; client also disables the button once `reply` is set.

**Mock router** (`src/lib/mock/router.ts`): add handlers for `PickCallLater` (QA + TS) and `Warning/Reply` so dev keeps working.

---

## Step 4 — Reusable FilterBar across report pages

**New:**
- `src/components/filters/filter-bar.tsx` — composable bar taking a `fields` list, any subset of: `search`, `mobile`, `dateFrom`, `dateTo`, `agentId`, `campaignId`, `teamId`, `batchId`, `salesRepId`, `customerStatus`, `callResult`, `operationType`, `warningStatus`. Emits filters + **Reset** button.
- `src/components/filters/use-report-filters.ts` — state stored in TanStack Router search params (URL-shareable). Returns `{ filters, setFilter, reset, queryParams }`.
- Dropdown options hydrated from existing `src/lib/lookups.ts` hooks.

**`src/components/report-table.tsx`**
- Add optional `filterBar?: ReactNode` slot.
- Merge `queryParams` from the filter hook into the endpoint call.
- Add `readOnly?: boolean` prop that hides caller-provided action columns (used by Manager wrappers in Step 5).

**Apply FilterBar** (fields chosen per data shape):
- QA: `qa.reports.calls`, `qa.reports.customers`, `qa.reports.evaluations`, `qa.reports.agents`, `qa.reports.teams`, `qa.reports.sales-reps`, `qa.reports.batches`, `qa.call-history`.
- TS: `ts.reports.calls`, `ts.reports.leads`, `ts.reports.agents`, `ts.call-history`.
- Every customer/lead-bearing page includes `mobile` + `search`.

`ExportButton` visibility is unchanged.

---

## Step 5 — Manager dashboard

**Routes (new under `src/routes/_authenticated/`):**
- `manager.index.tsx` — shadcn `Tabs` with **TeleSales** and **Quality Assurance** panels. Each panel: KPI grid + summary charts + links to detail reports below.
- Read-only report wrappers (thin — each reuses the underlying QA/TS report component with `readOnly` and its own `SectionGuard`):
  - TS: `manager.ts.calls`, `manager.ts.leads`, `manager.ts.agents`, `manager.ts.campaigns`, `manager.ts.batches`, `manager.ts.warnings`
  - QA: `manager.qa.calls`, `manager.qa.evaluations`, `manager.qa.customers`, `manager.qa.agents`, `manager.qa.teams`, `manager.qa.sales-reps`, `manager.qa.batches`

**Sidebar** — Manager group (role 9 only): Overview + TeleSales sub-list + Quality Assurance sub-list.

**Dashboard router (`_authenticated/index.tsx`)** — role 9 → `<Navigate to="/manager" replace />`.

**Every Manager page includes:** FilterBar (§4), search (part of FilterBar), Export (existing), sorting + pagination (existing), zero row-action affordances.

---

## Technical notes
- No new npm dependencies. No schema or backend changes.
- New endpoints assumed present server-side: `POST /api/Queue/PickFromCallLater/{id}`, `POST /api/ts/Queue/PickCallLater/{id}`, `POST /api/ts/Warning/Reply/{id}`. Mock router mirrors them.
- All permission changes flow through `SectionGuard` — no hard-coded role checks in pages.

## Out of scope
- PDF export / Print (Excel + CSV export remain).
- Backend endpoint implementation.
- Visual redesign beyond added controls.
