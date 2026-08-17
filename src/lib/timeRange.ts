/**
 * 時刻の前後関係チェック（"HH:MM" の開始→終了）。
 * バックエンドの src/common/time-range.ts と同じ規則。保存前に画面側でも止める。
 */

function toMinutes(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * 「終了が開始と同じか、それより前」なら true。
 * どちらかが空・形式不正のときは判定しない（false）。
 */
export function isReversedRange(
  from?: string | null,
  to?: string | null,
): boolean {
  if (!from || !to) return false;
  const a = toMinutes(from);
  const b = toMinutes(to);
  if (a === null || b === null) return false;
  return b <= a;
}

/** 通所予定の逆転メッセージ（画面にそのまま出す）。問題なければ null。 */
export function planOrderError(
  planIn?: string | null,
  planOut?: string | null,
): string | null {
  return isReversedRange(planIn, planOut)
    ? '終了時刻は開始時刻より後にしてください。'
    : null;
}

/** 中抜けの逆転メッセージ。問題なければ null。 */
export function breakOrderError(
  plannedOut?: string | null,
  plannedIn?: string | null,
): string | null {
  return isReversedRange(plannedOut, plannedIn)
    ? '中抜けの戻り時刻は外出時刻より後にしてください。'
    : null;
}

/** 打刻の逆転メッセージ。問題なければ null。 */
export function clockOrderError(
  clockIn?: string | null,
  clockOut?: string | null,
): string | null {
  return isReversedRange(clockIn, clockOut)
    ? '退所時刻は通所時刻より後にしてください。'
    : null;
}
