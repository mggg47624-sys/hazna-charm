import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/cf/cf-ui";
import { RegistrationForm } from "@/components/cf/registration-form";
import { useCfAgentRegistration, useCfUpdateRegistration } from "@/lib/cf-api";
import { CF_EDITABLE_FIELD_LABELS, cfFieldLabels } from "@/lib/cf-types";

export const Route = createFileRoute("/_authenticated/cf/agent/registrations/$id/edit")({
  head: () => ({ meta: [
    { title: "Edit Registration — Consumer Finance" },
    { name: "description", content: "Correct and resubmit rejected Consumer Finance registrations." },
    { property: "og:title", content: "Edit Registration — Consumer Finance" },
    { property: "og:description", content: "Correct and resubmit rejected Consumer Finance registrations." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:agent"><Page /></SectionGuard>,
});

function Page() {
  const id = Number(Route.useParams().id);
  const navigate = useNavigate();
  const { data, isLoading, error } = useCfAgentRegistration(id);
  const update = useCfUpdateRegistration(id);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />;
  if (error || !data) return <p className="text-destructive">{error?.message ?? "Not found"}</p>;
  if (data.status !== 3) return <p className="text-muted-foreground">Only rejected registrations can be edited.</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Edit rejected registration" />
        <Alert variant="destructive">
          <AlertTitle>Rejection reasons</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="flex flex-wrap gap-1">{data.latestRejection?.reasons.map((x) => <Badge key={x} variant="outline" dir="auto">{x}</Badge>)}</div>
            {data.latestRejection?.note && <p dir="auto">{data.latestRejection.note}</p>}
            <p>You can only change: {cfFieldLabels(Array.isArray(data.editableFields) ? data.editableFields : Object.keys(CF_EDITABLE_FIELD_LABELS)) || "None"}</p>
          </AlertDescription>
        </Alert>
      <RegistrationForm key={id} nationalId={data.nationalId} initial={data} editableFields={data.editableFields} imagesRequired={false} submitting={update.isPending}
        onSubmit={(fd) => update.mutate(fd, {
          onSuccess: () => { toast.success("Registration resubmitted for review"); navigate({ to: "/cf/agent/registrations" }); },
          onError: (e) => toast.error(e.message),
        })} />
    </div>
  );
}
