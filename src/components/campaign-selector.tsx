import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampaigns } from "@/lib/ts-api";

interface Props {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  activeOnly?: boolean;
  className?: string;
  hideLabel?: boolean;
  labelText?: string;
  triggerClassName?: string;
}

/**
 * Shared TeleSales campaign picker.
 * No default value — the user MUST pick one from the list.
 */
export function CampaignSelector({
  value,
  onChange,
  activeOnly,
  className,
  hideLabel,
  labelText = "Select Campaign",
  triggerClassName = "w-56",
}: Props) {
  const campaigns = useCampaigns();
  const list = activeOnly
    ? (campaigns.data ?? []).filter((c: any) => c.isActive)
    : (campaigns.data ?? []);
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {!hideLabel && (
        <Label className="text-sm whitespace-nowrap text-muted-foreground">
          {labelText}
        </Label>
      )}
      <Select
        value={value ? String(value) : ""}
        onValueChange={(v) => onChange(v ? Number(v) : undefined)}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Select campaign" />
        </SelectTrigger>
        <SelectContent>
          {list.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
