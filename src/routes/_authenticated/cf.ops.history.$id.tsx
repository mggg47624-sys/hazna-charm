import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { PageHeader, RegistrationDetail } from "@/components/cf/cf-ui";
import { useCfOpsRegistration } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/ops/history/$id")({
  head: () => ({ meta: [
    { title: "Registration (read-only) — Consumer Finance" },
    { name: "description", content: "Read Consumer Finance registration documents and review rounds." },
    { property: "og:title", content: "Registration (read-only) — Consumer Finance" },
    { property: "og:description", content: "Read Consumer Finance registration documents and review rounds." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:ops-view"><Page /></SectionGuard>,
});

function Page() {
  const id = Number(Route.useParams().id);
  const { data, isLoading, error } = useCfOpsRegistration(id);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />;
  if (!data) return <p className="text-destructive">{error?.message ?? "Not found"}</p>;
  return <div className="space-y-4"><PageHeader title="Registration" subtitle={`#${id} · read-only`} /><RegistrationDetail data={data} /></div>;
}
