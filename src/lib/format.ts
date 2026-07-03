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
