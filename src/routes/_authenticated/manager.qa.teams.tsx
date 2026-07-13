import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/teams")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="Teams"
      subtitle="Team performance (read-only)"
      endpoint="/api/Report/Teams"
      queryKey={["reports", "teams"]}
      filename="qa-teams"
      filterFields={["search"]}
      searchKeys={[(r: any) => r.TeamLeaderName || r.teamLeaderName]}
      columns={[
        { key: "teamLeaderName", header: "Team Leader", accessor: (r: any) => r.TeamLeaderName || r.teamLeaderName || "—" },
        { key: "totalSalesReps", header: "Sales Reps", accessor: (r: any) => r.TotalSalesReps ?? r.totalSalesReps ?? 0 },
        { key: "totalEvaluations", header: "Evaluations", accessor: (r: any) => r.TotalEvaluations ?? r.totalEvaluations ?? 0 },
        {
          key: "teamAvgScore",
          header: "Avg Score",
          accessor: (r: any) => Number(r.TeamAvgScore ?? r.teamAvgScore ?? 0).toFixed(2),
        },
        { key: "highScoreCount", header: "High Scores", accessor: (r: any) => r.HighScoreCount ?? r.highScoreCount ?? 0 },
        { key: "lowScoreCount", header: "Low Scores", accessor: (r: any) => r.LowScoreCount ?? r.lowScoreCount ?? 0 },
      ]}
    />
  ),
});
