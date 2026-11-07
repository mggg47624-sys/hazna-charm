import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ts/reports/monthly")({
  component: () => <Outlet />,
});