import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/cf/cf-ui";
import { RegistrationForm } from "@/components/cf/registration-form";
import { useCfCheckNationalId, useCfCreateRegistration } from "@/lib/cf-api";
import { CF_MOCK, type CfCheckResult } from "@/lib/cf-types";
import { toWesternDigits, validateNationalId } from "@/lib/cf-validation";
import { mockNid } from "@/lib/cf-mock";

export const Route = createFileRoute("/_authenticated/cf/agent/new")({
  head: () => ({ meta: [{ title: "Add Customer — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:agent"><Page /></SectionGuard>,
});

function Page() {
  const navigate = useNavigate();
  const [nid, setNid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<CfCheckResult | null>(null);
  const [started, setStarted] = useState(false);
  const checker = useCfCheckNationalId();
  const create = useCfCreateRegistration();

  const doCheck = () => {
    const v = validateNationalId(nid);
    setError(v);
    setCheck(null);
    if (v) return;
    checker.mutate(nid, { onSuccess: setCheck, onError: (e) => toast.error(e.message) });
  };

  if (started)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title="Register customer" />
        <RegistrationForm nationalId={nid} imagesRequired submitting={create.isPending}
          onSubmit={(fd) => create.mutate(fd, {
            onSuccess: () => { toast.success("Registration submitted"); navigate({ to: "/cf/agent" }); },
            onError: (e) => toast.error(e.message),
          })} />
      </div>
    );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Add new customer" subtitle="Step 1 — eligibility check" />
      <Card>
        <CardContent className="space-y-3 p-4">
          <Label>National ID</Label>
          <Input inputMode="numeric" maxLength={14} className="h-14 text-lg tracking-widest" value={nid}
            onChange={(e) => { setNid(toWesternDigits(e.target.value).replace(/\D/g, "")); setCheck(null); }} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="h-14 w-full text-base" onClick={doCheck} disabled={checker.isPending}>
            {checker.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Check
          </Button>
          {CF_MOCK && <p className="break-words text-xs text-muted-foreground">Mock: 1 eligible {mockNid(20)} · 2 registered {mockNid(1)} · 3 rejected & editable {mockNid(8)} · 4 not eligible {mockNid(30)} · 5 expired ID {mockNid(31)} · 6 outdated check {mockNid(32)}</p>}
        </CardContent>
      </Card>
      {check?.result === 1 && (
        <Alert className="border-[color:var(--success)] text-[color:var(--success)]"><AlertDescription className="space-y-3">
          <p className="font-medium">Customer is eligible</p>
          <Button className="h-12 w-full" onClick={() => setStarted(true)}>Start registration</Button>
        </AlertDescription></Alert>
      )}
      {check?.result === 0 && <Alert variant="destructive"><AlertDescription>Customer is not eligible</AlertDescription></Alert>}
      {check?.result === 4 && <Alert variant="destructive"><AlertDescription>Customer is not eligible for financing</AlertDescription></Alert>}
      {check?.result === 5 && <Alert variant="destructive"><AlertDescription>The customer's national ID card has expired. The customer must renew the ID before registration.</AlertDescription></Alert>}
      {check?.result === 6 && <Alert className="border-[color:var(--warning)] text-[color:var(--warning)]"><AlertDescription>The eligibility check for this customer is older than 30 days. Ask the admin to refresh the list.</AlertDescription></Alert>}
      {check?.result === 2 && <Alert className="border-[color:var(--warning)]"><AlertDescription>This customer is already registered</AlertDescription></Alert>}
      {check?.result === 3 && check.registrationId && (
        <Alert variant="destructive"><AlertDescription className="space-y-3">
          <p>This registration was rejected and can be edited.</p>
          <Button asChild className="h-12 w-full"><Link to="/cf/agent/registrations/$id/edit" params={{ id: String(check.registrationId) }}>Edit rejected registration</Link></Button>
        </AlertDescription></Alert>
      )}
    </div>
  );
}
