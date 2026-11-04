import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { PageHeader, RegistrationDetail } from "@/components/cf/cf-ui";
import { useCfAdminRegistration } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/admin/registrations/$id")({
  head: () => ({ meta: [
    { title: "Registration Detail — Consumer Finance" },
    { name: "description", content: "View Consumer Finance registration details and status history." },
    { property: "og:title", content: "Registration Detail — Consumer Finance" },
    { property: "og:description", content: "View Consumer Finance registration details and status history." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

function Page() {
  const id = Number(Route.useParams().id);
  const { data, isLoading, error } = useCfAdminRegistration(id);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />;
  if (!data) return <p className="text-destructive">{error?.message ?? "Not found"}</p>;
  return <div className="space-y-4"><PageHeader title="Registration" subtitle={`#${id}`} /><RegistrationDetail data={data} /></div>;
}
