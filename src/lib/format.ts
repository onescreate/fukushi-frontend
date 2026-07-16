export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ja-JP');
}

export function formatAddress(e: {
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
}): string {
  const body = [e.prefecture, e.city, e.addressLine].filter(Boolean).join('');
  if (!body && !e.postalCode) return '';
  const zip = e.postalCode ? `〒${e.postalCode} ` : '';
  return (zip + body).trim();
}

/** 2桁ゼロ埋め（月日・時刻の整形用） */
export const pad = (n: number): string => String(n).padStart(2, '0');

/** 円表示（¥1,234） */
export const yen = (n: number): string => `¥${n.toLocaleString('ja-JP')}`;
