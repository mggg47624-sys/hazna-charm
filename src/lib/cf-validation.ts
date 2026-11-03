/** Convert Arabic-Indic / Persian digits to Western digits. */
export function toWesternDigits(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Validates an Egyptian national ID. Returns an error message or null. */
export function validateNationalId(raw: string): string | null {
  const id = toWesternDigits(raw.trim());
  if (!/^\d{14}$/.test(id)) return "National ID must be exactly 14 digits";
  if (id[0] !== "2" && id[0] !== "3") return "National ID must start with 2 or 3";
  const year = (id[0] === "2" ? 1900 : 2000) + Number(id.slice(1, 3));
  const month = Number(id.slice(3, 5));
  const day = Number(id.slice(5, 7));
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day)
    return "National ID contains an invalid birth date";
  if (d.getTime() > Date.now()) return "National ID birth date is in the future";
  return null;
}

export function validateMobile(raw: string): string | null {
  return /^01\d{9}$/.test(toWesternDigits(raw.trim())) ? null : "Mobile must be 11 digits starting with 01";
}

export function validateFutureDate(v: string): string | null {
  if (!v) return "Required";
  const today = new Date().toISOString().slice(0, 10);
  return v > today ? null : "Expiration date must be in the future";
}

/** Resize to max side 1600px and re-encode as JPEG (q=0.8). */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
