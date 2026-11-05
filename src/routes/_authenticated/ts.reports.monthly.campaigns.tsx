import { createFileRoute } from "@tanstack/react-router";
import { SectionGuard } from "@/components/section-guard";
import { TsMonthlyReport } from "@/components/ts-monthly-reports";

export const Route = createFileRoute("/_authenticated/ts/reports/monthly/campaigns")({
  head: () => ({ meta: [
    { title: "Campaign Performance — Khazna Portal" },
    { name: "description", content: "Compare monthly TeleSales campaigns by call volume, reach, and conversion." },
    { property: "og:title", content: "Campaign Performance — Khazna Portal" },
    { property: "og:description", content: "Compare monthly TeleSales campaigns by call volume, reach, and conversion." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="ts:performance-report"><TsMonthlyReport kind="campaigns" /></SectionGuard>,
});