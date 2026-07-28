import { useState } from 'react';

export interface MonthNav {
  /** 対象の年（西暦） */
  year: number;
  /** 対象の月（1-12） */
  month: number;
  /** 月を delta ぶん移動する（年跨ぎは自動で正規化。負値=前月/正値=翌月）。 */
  changeMonth: (delta: number) => void;
  /** 年月を直接指定する。 */
  setYearMonth: (year: number, month: number) => void;
}

/**
 * 「対象の年月（1-12）」と前後移動を提供する共通フック。初期値は今月。
 * 各画面に散らばっていた year/month の useState と changeMonth を一本化する（挙動は不変）。
 */
export function useMonthNav(): MonthNav {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    // 年跨ぎを正規化（|delta|>1 でも対応）
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const setYearMonth = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  return { year, month, changeMonth, setYearMonth };
}
