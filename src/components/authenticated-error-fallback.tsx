import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearToken } from "@/lib/api";

export function AuthenticatedErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const message = error instanceof Error ? error.message : "An unexpected error occurred while loading this page.";
  console.error("[_authenticated] render error:", error);
  const signOutAndRetry = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground break-words">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
            <Button variant="outline" onClick={signOutAndRetry}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out &amp; retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}