import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, Lock, RotateCcw } from "lucide-react";
import { CF_CHANNELS, CF_FILE_SLOTS, type CfFile, type CfFileType } from "@/lib/cf-types";
import { compressImage, toWesternDigits, validateFutureDate, validateMobile } from "@/lib/cf-validation";

export interface RegFormInitial { khaznaMobile?: string; idExpirationDate?: string; amount?: number; channelId?: number; files?: CfFile[] }

/** Shared create/edit form. `imagesRequired` = all 6 must be captured (create mode). */
export function RegistrationForm({
  nationalId, initial, editableFields, imagesRequired, submitting, onSubmit,
}: {
  nationalId: string; initial?: RegFormInitial; editableFields?: string[]; imagesRequired: boolean; submitting: boolean; onSubmit: (fd: FormData) => void;
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
  const canEdit = (field: string) => !initial || !Array.isArray(editableFields) || editableFields.includes(field);
  const changed = !initial ||
    (canEdit("khaznaMobile") && mobile !== (initial.khaznaMobile ?? "")) ||
    (canEdit("idExpirationDate") && expiry !== (initial.idExpirationDate?.slice(0, 10) ?? "")) ||
    (canEdit("amount") && Number(amount) !== initial.amount) ||
    (canEdit("channelId") && Number(channel) !== initial.channelId) ||
    CF_FILE_SLOTS.some((slot) => canEdit(slot.type) && !!files[slot.type]);
  const lock = (field: string) => !canEdit(field) && <Lock aria-label="Locked" className="h-3 w-3 text-muted-foreground" />;
  const inputClass = (field: string) => `h-12 ${canEdit(field) ? "" : "bg-muted text-muted-foreground"}`;

  const errors = {
    mobile: canEdit("khaznaMobile") ? validateMobile(mobile) : null,
    expiry: canEdit("idExpirationDate") ? validateFutureDate(expiry) : null,
    amount: !canEdit("amount") || Number(amount) > 0 ? null : "Amount must be greater than 0",
    channel: !canEdit("channelId") || channel ? null : "Select a channel",
  };
  const missingImages = CF_FILE_SLOTS.filter((s) => canEdit(s.type) && (imagesRequired ? !files[s.type] : !previews[s.type]));
  const valid = Object.values(errors).every((e) => !e) && !missingImages.length;

  const capture = async (type: CfFileType, f?: File) => {
    if (!f || !canEdit(type)) return;
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
    if (!valid || !changed || submitting || busy) return;
    const fd = new FormData();
    fd.append("nationalId", nationalId);
    fd.append("khaznaMobile", canEdit("khaznaMobile") ? toWesternDigits(mobile) : initial?.khaznaMobile ?? mobile);
    fd.append("idExpirationDate", expiry);
    fd.append("amount", canEdit("amount") ? toWesternDigits(amount) : String(initial?.amount ?? amount));
    fd.append("channelId", channel);
    Object.entries(files).forEach(([k, f]) => f && canEdit(k) && fd.append(k, f));
    onSubmit(fd);
  };

  const err = (m: string | null) => m && <p className="text-xs text-destructive">{m}</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>National ID</Label><Input value={nationalId} readOnly className="h-12 bg-muted" /></div>
          <div className="space-y-1"><Label htmlFor="cf-mobile">Khazna registered mobile {lock("khaznaMobile")}</Label><Input id="cf-mobile" disabled={!canEdit("khaznaMobile")} inputMode="numeric" className={inputClass("khaznaMobile")} value={mobile} onChange={(e) => setMobile(toWesternDigits(e.target.value))} placeholder="01XXXXXXXXX" />{mobile && err(errors.mobile)}</div>
          <div className="space-y-1"><Label htmlFor="cf-expiry">ID expiration date {lock("idExpirationDate")}</Label><Input id="cf-expiry" disabled={!canEdit("idExpirationDate")} type="date" className={inputClass("idExpirationDate")} value={expiry} onChange={(e) => setExpiry(e.target.value)} />{expiry && err(errors.expiry)}</div>
          <div className="space-y-1"><Label htmlFor="cf-amount">Amount {lock("amount")}</Label><Input id="cf-amount" disabled={!canEdit("amount")} inputMode="decimal" className={inputClass("amount")} value={amount} onChange={(e) => setAmount(toWesternDigits(e.target.value))} />{amount && err(errors.amount)}</div>
          <div className="space-y-1"><Label htmlFor="cf-channel">Channel {lock("channelId")}</Label>
            <Select disabled={!canEdit("channelId")} value={channel} onValueChange={setChannel}>
              <SelectTrigger id="cf-channel" className={inputClass("channelId")}><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>{CF_CHANNELS.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {CF_FILE_SLOTS.map((s, i) => (
          <Card key={s.type}>
            <CardContent className="space-y-2 p-3">
              <p className="flex items-center gap-2 text-sm font-medium">{i + 1}. {s.label} {lock(s.type)}</p>
              {previews[s.type] && <img src={previews[s.type]} alt={s.label} className="h-40 w-full rounded object-cover" />}
              {canEdit(s.type) && <Button asChild variant={previews[s.type] ? "outline" : "default"} className="h-12 w-full">
                <label className="cursor-pointer">
                  {busy === s.type ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : previews[s.type] ? <RotateCcw className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                  {previews[s.type] ? "Retake" : "Capture"}
                  <input type="file" accept="image/*" capture={s.capture} className="hidden" onChange={(e) => { capture(s.type, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              </Button>}
            </CardContent>
          </Card>
        ))}
      </div>
      {!!missingImages.length && <p className="text-sm text-muted-foreground">Missing images: {missingImages.map((m) => m.label).join(", ")}</p>}
      <Button className="h-14 w-full text-base" disabled={!valid || !changed || submitting || !!busy} onClick={submit}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit registration
      </Button>
    </div>
  );
}
