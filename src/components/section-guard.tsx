import type { ReactNode } from "react";
import { useRequireSection } from "@/lib/use-require-section";
import type { Section } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/**
 * Wraps a page and shows nothing (then redirects) when the current role lacks
 * access. Use at the top of `_authenticated/*` pages that should be gated.
 */
export function SectionGuard({
  section,
  children,
}: {
  section: Section;
  children: ReactNode;
}) {
  const allowed = useRequireSection(section);
  if (!allowed) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
