import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { CampaignSelector } from "@/components/campaign-selector";
import {
  useCampaignCallResults,
  useCampaigns,
  useSetCampaignCallResults,
} from "@/lib/ts-api";
import { useCallResults } from "@/lib/lookups";


export const Route = createFileRoute("/_authenticated/ts/admin/call-results")({
  component: () => (
    <SectionGuard section="ts:admin-config">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const campaigns = useCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const current = useCampaignCallResults(activeCid);
  const allCr = useCallResults();
  const save = useSetCampaignCallResults();
  const [sel, setSel] = useState<Set<number> | null>(null);

  // Normalize server payload — backend may return {id,name} OR {callResultId, callResultName}
  const currentIds = useMemo(() => {
    return (current.data ?? [])
      .map((r: any) => Number(r?.id ?? r?.callResultId ?? r?.CallResultId))
      .filter((n) => Number.isFinite(n));
  }, [current.data]);

  const selected = useMemo(() => {
    if (sel) return sel;
    return new Set<number>(currentIds);
  }, [sel, currentIds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaign Call Results</h1>
          <p className="text-sm text-muted-foreground">
            Pick which call-result pool feeds this campaign. Leave empty for the Normal Queue (all leads).
          </p>
        </div>
        <CampaignSelector value={activeCid} onChange={(v) => { setCid(v); setSel(null); }} />
      </div>


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Call Results</CardTitle>
            {activeCid && !current.isLoading && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Currently selected:</span>
                {currentIds.length === 0 ? (
                  <Badge variant="outline">Normal Queue (all leads)</Badge>
                ) : (
                  currentIds.map((id) => {
                    const r = (allCr.data ?? []).find((x) => x.id === id);
                    return (
                      <Badge key={id} variant="secondary">
                        {r ? (r.nameEn ?? r.name) : `#${id}`}
                      </Badge>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!activeCid ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              Select a campaign to configure its call-result pool.
            </p>
          ) : current.isLoading || allCr.isLoading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <>
              {(allCr.data ?? []).map((r) => (
                <label key={r.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted/40 cursor-pointer">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={(v) => {
                      setSel((prev) => {
                        const base = new Set(prev ?? selected);
                        if (v) base.add(r.id); else base.delete(r.id);
                        return base;
                      });
                    }}
                  />
                  <span className="text-sm">{r.nameEn ?? r.name}</span>
                </label>
              ))}
              <div className="pt-2">
                <Button
                  disabled={!activeCid || save.isPending}
                  onClick={() =>
                    save.mutate(
                      { campaignId: activeCid!, callResultIds: [...selected] },
                      {
                        onSuccess: () => { toast.success("Saved — lead availability updated"); current.refetch(); setSel(null); },
                        onError: (e: Error) => toast.error(e.message),
                      },
                    )
                  }
                >
                  {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Empty selection = Normal Queue: all UnAssigned leads.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;
export { Page as CampaignCallResultsPage };
export const __hint = <Label />;
void useCampaigns; void useCampaignCallResults; void useSetCampaignCallResults;

