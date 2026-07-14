import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
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
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const current = useCampaignCallResults(activeCid);
  const allCr = useCallResults();
  const save = useSetCampaignCallResults();
  const [sel, setSel] = useState<Set<number> | null>(null);

  const selected = useMemo(() => {
    if (sel) return sel;
    return new Set((current.data ?? []).map((r) => r.id));
  }, [sel, current.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaign Call Results</h1>
          <p className="text-sm text-muted-foreground">
            Pick which call-result pool feeds this campaign. Leave empty for the Normal Queue (all leads).
          </p>
        </div>
        <Select value={activeCid ? String(activeCid) : ""} onValueChange={(v) => { setCid(Number(v)); setSel(null); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Campaign" /></SelectTrigger>
          <SelectContent>
            {campaigns.data?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Call Results</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {current.isLoading || allCr.isLoading ? (
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
                        onSuccess: () => { toast.success("Saved — lead availability updated"); current.refetch(); },
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
