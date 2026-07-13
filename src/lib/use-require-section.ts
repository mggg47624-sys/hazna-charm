import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, useCanAccess, useIsQaAgent, useIsTsAgent, type Section } from "@/lib/auth";

/**
 * Client-side route guard. Redirects to the appropriate landing page when the
 * current role lacks `section` access. QA/TS agents go to their work queue;
 * everyone else lands on the dashboard.
 */
export function useRequireSection(section: Section) {
  const { user, loading } = useAuth();
  const allowed = useCanAccess(section);
  const qa = useIsQaAgent();
  const ts = useIsTsAgent();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    if (!allowed) {
      const to = qa ? "/qa/work" : ts ? "/ts/work" : "/";
      navigate({ to, replace: true });
    }
  }, [loading, user, allowed, qa, ts, navigate]);
  return allowed;
}
