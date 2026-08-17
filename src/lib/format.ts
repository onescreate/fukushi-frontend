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

/** 日時を「2026/8/17 10:23」の形に（日本時間で表示）。 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 2桁ゼロ埋め（月日・時刻の整形用） */
export const pad = (n: number): string => String(n).padStart(2, '0');

/** 円表示（¥1,234） */
export const yen = (n: number): string => `¥${n.toLocaleString('ja-JP')}`;
