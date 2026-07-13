import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  label?: string;
  className?: string;
}

/** Small icon button that copies `value` to the clipboard with a toast. */
export function CopyButton({ value, label = "Copied to clipboard", className }: Props) {
  const [ok, setOk] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setOk(true);
      toast.success(label);
      setTimeout(() => setOk(false), 1400);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={`h-7 w-7 ${className ?? ""}`}
      onClick={copy}
      aria-label="Copy"
    >
      {ok ? <Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
