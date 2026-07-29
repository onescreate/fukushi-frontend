// 日本の祝日判定（自己完結・外部依存なし）。
// 固定祝日＋ハッピーマンデー＋春分/秋分（近似式・1980-2099目安）＋振替休日＋国民の休日に対応。
// 返り値：祝日名（例「元日」）／祝日でなければ null。表示用途（赤字＋名称）を想定。

const FIXED: Record<string, string> = {
  '1-1': '元日',
  '2-11': '建国記念の日',
  '2-23': '天皇誕生日',
  '4-29': '昭和の日',
  '5-3': '憲法記念日',
  '5-4': 'みどりの日',
  '5-5': 'こどもの日',
  '8-11': '山の日',
  '11-3': '文化の日',
  '11-23': '勤労感謝の日',
};

function nthMonday(year: number, month: number, nth: number): number {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=日
  const firstMonday = ((8 - firstDow) % 7) + 1;
  return firstMonday + (nth - 1) * 7;
}

function vernalEquinox(year: number): number {
  return Math.floor(
    20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}
function autumnalEquinox(year: number): number {
  return Math.floor(
    23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

// 固定・ハッピーマンデー・春分秋分だけの判定（振替・国民の休日は含まない）。
function baseHolidayName(
  year: number,
  month: number,
  day: number,
): string | null {
  const fixed = FIXED[`${month}-${day}`];
  if (fixed) return fixed;
  if (month === 1 && day === nthMonday(year, 1, 2)) return '成人の日';
  if (month === 7 && day === nthMonday(year, 7, 3)) return '海の日';
  if (month === 9 && day === nthMonday(year, 9, 3)) return '敬老の日';
  if (month === 10 && day === nthMonday(year, 10, 2)) return 'スポーツの日';
  if (month === 3 && day === vernalEquinox(year)) return '春分の日';
  if (month === 9 && day === autumnalEquinox(year)) return '秋分の日';
  return null;
}

/** その日の祝日名を返す（祝日でなければ null）。 */
export function getHolidayName(date: Date): string | null {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const direct = baseHolidayName(y, m, d);
  if (direct) return direct;

  // 振替休日：直前に連続する祝日を遡り、日曜の祝日があればこの日は振替休日。
  {
    let cursor = new Date(y, m - 1, d - 1);
    while (
      baseHolidayName(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        cursor.getDate(),
      )
    ) {
      if (cursor.getDay() === 0) return '振替休日';
      cursor = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate() - 1,
      );
    }
  }

  // 国民の休日：前後がともに祝日で、その日自体が平日（日曜以外）。
  if (date.getDay() !== 0) {
    const prev = new Date(y, m - 1, d - 1);
    const next = new Date(y, m - 1, d + 1);
    if (
      baseHolidayName(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()) &&
      baseHolidayName(next.getFullYear(), next.getMonth() + 1, next.getDate())
    ) {
      return '国民の休日';
    }
  }

  return null;
}

export function isHoliday(date: Date): boolean {
  return getHolidayName(date) !== null;
}
