import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { CF_CHANNELS, CF_FILE_SLOTS, type CfFile, type CfFileType } from "@/lib/cf-types";
import { compressImage, toWesternDigits, validateFutureDate, validateMobile } from "@/lib/cf-validation";

export interface RegFormInitial { khaznaMobile?: string; idExpirationDate?: string; amount?: number; channelId?: number; files?: CfFile[] }

/** Shared create/edit form. `imagesRequired` = all 6 must be captured (create mode). */
export function RegistrationForm({
  nationalId, initial, imagesRequired, submitting, onSubmit,
}: {
  nationalId: string; initial?: RegFormInitial; imagesRequired: boolean; submitting: boolean; onSubmit: (fd: FormData) => void;
}) {
  const [mobile, setMobile] = useState(initial?.khaznaMobile ?? "");
  const [expiry, setExpiry] = useState(initial?.idExpirationDate?.slice(0, 10) ?? "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [channel, setChannel] = useState(initial?.channelId ? String(initial.channelId) : "");
  const [files, setFiles] = useState<Partial<Record<CfFileType, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<CfFileType, string>>>(
    Object.fromEntries((initial?.files ?? []).map((f) => [f.type, f.url])),
  );
  const [busy, setBusy] = useState<CfFileType | null>(null);

  const errors = {
    mobile: validateMobile(mobile),
    expiry: validateFutureDate(expiry),
    amount: Number(amount) > 0 ? null : "Amount must be greater than 0",
    channel: channel ? null : "Select a channel",
  };
  const missingImages = CF_FILE_SLOTS.filter((s) => (imagesRequired ? !files[s.type] : !previews[s.type]));
  const valid = Object.values(errors).every((e) => !e) && !missingImages.length;

  const capture = async (type: CfFileType, f?: File) => {
    if (!f) return;
    setBusy(type);
    try {
      const c = await compressImage(f);
      setFiles((p) => ({ ...p, [type]: c }));
      setPreviews((p) => ({ ...p, [type]: URL.createObjectURL(c) }));
    } finally {
      setBusy(null);
    }
  };

  const submit = () => {
    const fd = new FormData();
    fd.append("nationalId", nationalId);
    fd.append("khaznaMobile", toWesternDigits(mobile));
    fd.append("idExpirationDate", expiry);
    fd.append("amount", toWesternDigits(amount));
    fd.append("channelId", channel);
    Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
    onSubmit(fd);
  };

  const err = (m: string | null) => m && <p className="text-xs text-destructive">{m}</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>National ID</Label><Input value={nationalId} readOnly className="h-12 bg-muted" /></div>
          <div className="space-y-1"><Label>Khazna registered mobile</Label><Input inputMode="numeric" className="h-12" value={mobile} onChange={(e) => setMobile(toWesternDigits(e.target.value))} placeholder="01XXXXXXXXX" />{mobile && err(errors.mobile)}</div>
          <div className="space-y-1"><Label>ID expiration date</Label><Input type="date" className="h-12" value={expiry} onChange={(e) => setExpiry(e.target.value)} />{expiry && err(errors.expiry)}</div>
          <div className="space-y-1"><Label>Amount</Label><Input inputMode="decimal" className="h-12" value={amount} onChange={(e) => setAmount(toWesternDigits(e.target.value))} />{amount && err(errors.amount)}</div>
          <div className="space-y-1"><Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>{CF_CHANNELS.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {CF_FILE_SLOTS.map((s, i) => (
          <Card key={s.type}>
            <CardContent className="space-y-2 p-3">
              <p className="text-sm font-medium">{i + 1}. {s.label}</p>
              {previews[s.type] && <img src={previews[s.type]} alt={s.label} className="h-40 w-full rounded object-cover" />}
              <Button asChild variant={previews[s.type] ? "outline" : "default"} className="h-12 w-full">
                <label className="cursor-pointer">
                  {busy === s.type ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : previews[s.type] ? <RotateCcw className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                  {previews[s.type] ? "Retake" : "Capture"}
                  <input type="file" accept="image/*" capture={s.capture} className="hidden" onChange={(e) => { capture(s.type, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {!!missingImages.length && <p className="text-sm text-muted-foreground">Missing images: {missingImages.map((m) => m.label).join(", ")}</p>}
      <Button className="h-14 w-full text-base" disabled={!valid || submitting} onClick={submit}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit registration
      </Button>
    </div>
  );
}
