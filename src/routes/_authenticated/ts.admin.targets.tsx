import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { useCampaign, useCampaigns, useSetAgentTarget } from "@/lib/ts-api";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/targets")({
  component: () => (
    <SectionGuard section="ts:admin-config">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const campaign = useCampaign(activeCid);
  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  const setTarget = useSetAgentTarget();
  const [values, setValues] = useState<Record<number, string>>({});

  const agents = (campaign.data?.agents ?? []).map((a) => {
    const u = (users.data ?? []).find((x) => x.id === a.agentId);
    return { ...a, fullName: u?.fullName ?? a.agentName };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agent Daily Targets</h1>
          <p className="text-sm text-muted-foreground">Set the minimum calls per day per agent per campaign.</p>
        </div>
        <CampaignSelector value={activeCid} onChange={setCid} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Agents</CardTitle></CardHeader>
        <CardContent className="p-0">
          {campaign.isLoading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Min Calls</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell className="font-medium">{a.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{a.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Input
                          type="number" min={0} className="w-24"
                          value={values[a.agentId] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [a.agentId]: e.target.value }))}
                          placeholder="e.g. 50"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        disabled={!values[a.agentId] || setTarget.isPending}
                        onClick={() =>
                          setTarget.mutate(
                            { campaignId: activeCid!, agentId: a.agentId, minCalls: Number(values[a.agentId]) },
                            {
                              onSuccess: () => toast.success(`Target saved for ${a.fullName}`),
                              onError: (e: Error) => toast.error(e.message),
                            },
                          )
                        }
                      >
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!agents.length && (
                  <TableRow><TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No agents in this campaign</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Use <Label className="inline" /> Warnings → Generate at end of day to auto-warn under-target agents.
      </p>
    </div>
  );
}
