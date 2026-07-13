import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/agents")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="QA Agents"
      subtitle="Per-agent QA statistics (read-only)"
      endpoint="/api/Report/Agents"
      queryKey={["reports", "agents"]}
      filename="qa-agents"
      filterFields={["search"]}
      searchKeys={[(r: any) => r.AgentName || r.agentName]}
      columns={[
        { key: "agentName", header: "Agent", accessor: (r: any) => r.AgentName || r.agentName || "—" },
        { key: "totalCalls", header: "Calls", accessor: (r: any) => r.TotalCalls ?? r.totalCalls ?? 0 },
        { key: "answeredCalls", header: "Answered", accessor: (r: any) => r.AnsweredCalls ?? r.answeredCalls ?? 0 },
        { key: "noAnswerCalls", header: "No Answer", accessor: (r: any) => r.NoAnswerCalls ?? r.noAnswerCalls ?? 0 },
        { key: "callLaterCalls", header: "Call Later", accessor: (r: any) => r.CallLaterCalls ?? r.callLaterCalls ?? 0 },
        { key: "totalEvaluations", header: "Evaluations", accessor: (r: any) => r.TotalEvaluations ?? r.totalEvaluations ?? 0 },
        {
          key: "avgScoreGiven",
          header: "Avg Score",
          accessor: (r: any) => Number(r.AvgScoreGiven ?? r.avgScoreGiven ?? 0).toFixed(2),
        },
      ]}
    />
  ),
});
