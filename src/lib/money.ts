/** Store money as integer pence to avoid float errors. */

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(penceToPounds(pence));
}

export function parsePoundsInput(value: string): number | null {
  const trimmed = value.trim().replace(/[£,\s]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  return poundsToPence(n);
}
