import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  BarChart3,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Khazna Sales QA" },
      {
        name: "description",
        content:
          "Secure sign-in for Khazna Sales Quality Assurance and TeleSales teams — dashboards, evaluations and call reporting.",
      },
      { property: "og:title", content: "Sign in — Khazna Sales QA" },
      {
        property: "og:description",
        content:
          "Secure sign-in for Khazna Sales Quality Assurance and TeleSales teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  {
    icon: PhoneCall,
    title: "Unified call workflow",
    text: "Queue, call later and history in one operational flow.",
  },
  {
    icon: CheckCircle2,
    title: "Quality evaluations",
    text: "Structured scoring with dynamic campaign forms.",
  },
  {
    icon: BarChart3,
    title: "Executive reporting",
    text: "Live KPIs, agent performance and exportable reports.",
  },
];

function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  // Subtle pointer-reactive tilt / glow on the card
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.transform = `perspective(1200px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 5}deg)`;
  };
  const onPointerLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 auth-grid opacity-[0.35]" />
        <div className="auth-blob absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-primary/25 blur-[120px]" />
        <div className="auth-blob-2 absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full bg-[color:var(--chart-5)]/20 blur-[130px]" />
        <div className="auth-blob absolute top-1/3 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[color:var(--success)]/15 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Brand / value panel */}
        <section className="hidden lg:flex flex-col auth-rise">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center auth-sheen">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">Khazna Sales QA</p>
              <p className="text-xs text-muted-foreground">Quality Assurance &amp; TeleSales Platform</p>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
            Run every call with
            <span className="block bg-gradient-to-r from-primary via-[color:var(--chart-5)] to-[color:var(--success)] bg-clip-text text-transparent">
              measurable quality.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            One workspace for agents, team leaders and managers — from live queues
            to executive dashboards.
          </p>

          <ul className="mt-9 space-y-3">
            {highlights.map((h, i) => (
              <li
                key={h.title}
                className="auth-rise group flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <h.icon className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{h.title}</span>
                  <span className="block text-xs text-muted-foreground">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--success)] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--success)]" />
              </span>
              Systems operational
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Encrypted session
            </span>
          </div>
        </section>

        {/* Sign-in card */}
        <section className="flex justify-center">
          <div
            ref={cardRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="auth-rise relative w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-7 shadow-2xl shadow-primary/10 backdrop-blur-xl transition-transform duration-300 will-change-transform sm:p-9"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-70"
              style={{
                background:
                  "radial-gradient(500px circle at var(--mx,50%) var(--my,0%), color-mix(in oklab, var(--primary) 12%, transparent), transparent 60%)",
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Shield className="h-5.5 w-5.5" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">Khazna Sales QA</p>
                  <p className="text-xs text-muted-foreground">Quality Assurance Portal</p>
                </div>
              </div>

              <div className="mt-6 lg:mt-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-medium text-secondary-foreground">
                  <Lock className="h-3 w-3" /> Secure access
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Sign in</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use your work credentials to continue.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </Label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="name@khazna.com"
                      className="h-12 rounded-xl pl-10 transition-shadow focus-visible:shadow-lg focus-visible:shadow-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Password
                  </Label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl pl-10 pr-11 transition-shadow focus-visible:shadow-lg focus-visible:shadow-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(v) => setRemember(Boolean(v))}
                    />
                    Keep me signed in
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "group h-12 w-full rounded-xl text-sm font-medium",
                    "bg-gradient-to-r from-primary to-[color:var(--chart-5)]",
                    "shadow-lg shadow-primary/25 transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Khazna Financial Services
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
