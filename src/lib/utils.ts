import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes "active" status across possible API field names.
 * Handles boolean, numeric (1/0), and string ("active"/"inactive"/"true"/"false") values.
 */
export function isRecordActive(row: any): boolean {
  if (!row || typeof row !== "object") return false;
  const v =
    row.isActive ??
    row.IsActive ??
    row.active ??
    row.Active ??
    row.status ??
    row.Status;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "true" || s === "active" || s === "1" || s === "enabled";
  }
  return false;
}
