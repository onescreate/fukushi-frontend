import { pad } from '@/lib/format';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../lib/errors';
import {
  fetchKioskUsers,
  kioskAuthenticate,
  kioskBoard,
  kioskClock,
  kioskHealth,
  kioskMeal,
  kioskSubmitReason,
  kioskToken,
  type ClockResult,
  type KioskBoard,
  type KioskUser,
  type ReasonKind,
  type TodayStatus,
} from '../features/kiosk/api';

const REASON_LABEL: Record<ReasonKind, string> = {
  absence: '欠席',
  late: '遅刻',
  early: '早退',
};

type Stage = 'loading' | 'setup' | 'select' | 'pin' | 'clock' | 'result';

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

/** "YYYY-MM-DD" を "M/D(曜)" に整形。 */
function formatVisitDate(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number);
  const wd = WEEKDAY[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${wd})`;
}

// 開発プレビュー：端末設定・PIN無しでタブレット画面の見た目を確認（VITE_DEV_SCREENS=1）
const DEV_PREVIEW = import.meta.env.VITE_DEV_SCREENS === '1';
const MOCK_USERS = [
  { id: 'dev-1', name: 'サンプル 太郎' },
  { id: 'dev-2', name: 'サンプル 花子' },
] as unknown as KioskUser[];
const MOCK_BOARD = {
  today: {
    planIn: '10:00',
    planOut: '15:00',
    status: 'approved',
    breaks: [{ plannedOut: '13:00', plannedIn: '14:00', note: '通院：精神科' }],
    meal: { status: 'reserved' },
  },
  nextVisit: {
    date: '2026-08-01',
    planIn: '10:00',
    planOut: '15:00',
    breaks: [],
    practicePlace: null,
    mealReserved: false,
  },
  alerts: { rejected: [], reasonNeeded: [] },
  needsHealthInput: true,
} as unknown as KioskBoard;

/** 共通の白カード（画面全体をラップ）。再マウントを避けるためモジュール直下に定義。 */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  );
}

/** 予定の1行（ラベル＋値）。 */
function PlanRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}

/** 中抜けの行（複数）。無ければ「なし」を1行表示。用件があれば併記。 */
function BreakRows({
  breaks,
}: {
  breaks: { plannedOut: string | null; plannedIn: string | null; note: string | null }[];
}) {
  if (breaks.length === 0) return <PlanRow label="中抜け" value="なし" />;
  return (
    <>
      {breaks.map((b, i) => (
        <PlanRow
          key={i}
          label="中抜け"
          value={
            <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
              <span className="font-mono">
                {b.plannedOut ?? '—'} 〜 {b.plannedIn ?? '—'}
              </span>
              {b.note && (
                <span className="text-xs font-normal text-slate-500">{b.note}</span>
              )}
            </span>
          }
        />
      ))}
    </>
  );
}

export default function KioskPage() {
  const [stage, setStage] = useState<Stage>('loading');
  const [users, setUsers] = useState<KioskUser[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<KioskUser | null>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [operationToken, setOperationToken] = useState('');
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [board, setBoard] = useState<KioskBoard | null>(null);
  const [kioskWeight, setKioskWeight] = useState('');
  const [reasonItem, setReasonItem] = useState<{
    date: string;
    kind: ReasonKind;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [result, setResult] = useState<ClockResult | null>(null);
  const [clock, setClock] = useState(new Date());
  const [previewMode, setPreviewMode] = useState(false);

  // 開発プレビュー：サンプルデータで打刻画面を表示（記録はしない）
  const startDevPreview = () => {
    setPreviewMode(true);
    setUsers(MOCK_USERS);
    setStage('select');
  };

  // 時計を1秒ごとに更新
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadUsers = async (token: string) => {
    const res = await fetchKioskUsers(token);
    setUsers(res.users);
  };

  useEffect(() => {
    const t = kioskToken.get();
    if (!t) {
      setStage('setup');
      return;
    }
    loadUsers(t)
      .then(() => setStage('select'))
      .catch(() => {
        kioskToken.clear();
        setStage('setup');
      });
  }, []);

  const handleSetup = async () => {
    setBusy(true);
    try {
      await loadUsers(tokenInput.trim());
      kioskToken.set(tokenInput.trim());
      setStage('select');
    } catch (err) {
      toast.error(getApiErrorMessage(err, '端末トークンが正しくありません'));
    } finally {
      setBusy(false);
    }
  };

  const resetDevice = () => {
    kioskToken.clear();
    setUsers([]);
    setTokenInput('');
    setStage('setup');
  };

  const backToSelect = () => {
    setSelected(null);
    setPin('');
    setQuery('');
    setOperationToken('');
    setToday(null);
    setBoard(null);
    setReasonItem(null);
    setReasonText('');
    setResult(null);
    setStage('select');
  };

  const submitReason = async () => {
    if (!reasonItem) return;
    setBusy(true);
    try {
      await kioskSubmitReason(
        operationToken,
        reasonItem.date,
        reasonItem.kind,
        reasonText,
      );
      toast.success('理由を登録しました');
      setReasonItem(null);
      setReasonText('');
      // 打刻画面のアラートから入力した場合は、その場でボードを更新。
      // 打刻直後(result)の場合はモーダルを閉じるだけ（自動で名前選択へ戻る）。
      if (stage !== 'result') {
        kioskBoard(operationToken).then(setBoard).catch(() => undefined);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // 理由モーダルを閉じる（任意なので閉じるだけ。result中なら閉じた後にタイマーが名前選択へ戻す）。
  const closeReason = () => {
    setReasonItem(null);
    setReasonText('');
  };

  // 完了画面(result)から自動で名前選択へ戻す。退所は次回予定を読む時間を長めに。
  // 理由モーダル表示中は戻さない（閉じてから改めて計測）。
  useEffect(() => {
    if (stage !== 'result' || reasonItem) return;
    const ms = result?.type === 'out' ? 8000 : 3500;
    const t = setTimeout(backToSelect, ms);
    return () => clearTimeout(t);
    // backToSelect は毎レンダー生成のため依存に含めない（意図的）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, reasonItem, result]);

  const pickUser = (u: KioskUser) => {
    setSelected(u);
    if (previewMode) {
      // プレビュー：PINを飛ばしてサンプルの打刻画面へ
      setToday({ clockedIn: false, clockedOut: false } as TodayStatus);
      setBoard(MOCK_BOARD);
      setStage('clock');
      return;
    }
    setPin('');
    setStage('pin');
  };

  const authenticate = async (value: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await kioskAuthenticate(kioskToken.get(), selected.id, value);
      setOperationToken(res.operationToken);
      setToday(res.attendance);
      setStage('clock');
      kioskBoard(res.operationToken).then(setBoard).catch(() => setBoard(null));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'PINが正しくありません'));
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const pressKey = (k: string) => {
    if (busy || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) void authenticate(next);
  };

  const doClock = async (type: 'in' | 'out') => {
    if (previewMode) {
      toast('プレビュー中は記録できません（デザイン確認用）');
      return;
    }
    setBusy(true);
    try {
      const res = await kioskClock(operationToken, type);
      setResult(res);
      setStage('result');
      // 遅刻(通所)・早退(退所)なら、その場で理由入力モーダルを表示（任意・スキップ可）。
      // 自動で名前選択へ戻る処理は useEffect のタイマーが担当する。
      const needReason =
        (type === 'in' && res.isLate) || (type === 'out' && res.isEarlyLeave);
      if (needReason) {
        const today = `${clock.getFullYear()}-${pad(clock.getMonth() + 1)}-${pad(clock.getDate())}`;
        setReasonItem({ date: today, kind: type === 'in' ? 'late' : 'early' });
        setReasonText('');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, '打刻に失敗しました'));
    } finally {
      setBusy(false);
    }
  };

  const doMeal = async (eaten: boolean) => {
    if (previewMode) {
      toast('プレビュー中は記録できません（デザイン確認用）');
      return;
    }
    setBusy(true);
    try {
      await kioskMeal(operationToken, eaten);
      const b = await kioskBoard(operationToken);
      setBoard(b);
      toast.success(eaten ? '食事の喫食を記録しました' : '喫食を取り消しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err, '食事の記録に失敗しました'));
    } finally {
      setBusy(false);
    }
  };

  const doHealth = async () => {
    if (previewMode) {
      toast('プレビュー中は記録できません（デザイン確認用）');
      return;
    }
    const val = Number(kioskWeight);
    if (!(val > 0)) {
      toast.error('体重を入力してください');
      return;
    }
    setBusy(true);
    try {
      await kioskHealth(operationToken, val);
      setKioskWeight('');
      const b = await kioskBoard(operationToken);
      setBoard(b);
      toast.success('体重を記録しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err, '体重の記録に失敗しました'));
    } finally {
      setBusy(false);
    }
  };

  const filtered = users.filter((u) => u.name.replace(/\s/g, '').includes(query.replace(/\s/g, '')));

  const timeStr = `${pad(clock.getHours())}:${pad(clock.getMinutes())}`;
  const dateStr = `${clock.getFullYear()}年${clock.getMonth() + 1}月${clock.getDate()}日 (${WEEKDAY[clock.getDay()]})`;

  // 理由入力モーダル（打刻画面のアラート・打刻直後の遅刻/早退の両方で使う）
  const isOptionalReason = stage === 'result';
  const reasonModal = reasonItem ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-bold text-slate-900">
          {REASON_LABEL[reasonItem.kind]}理由の入力
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          {reasonItem.date}
          {isOptionalReason && '（任意・スキップできます）'}
        </p>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={3}
          placeholder="理由を入力してください"
          className="mb-4 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
        />
        <div className="flex gap-2">
          <button
            onClick={closeReason}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600"
          >
            {isOptionalReason ? 'スキップ' : 'キャンセル'}
          </button>
          <button
            onClick={submitReason}
            disabled={busy || !reasonText.trim()}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white disabled:opacity-50"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ---------- 画面 ----------

  if (stage === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-400">
        読み込み中…
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <Shell>
        <h2 className="mb-1 text-center text-xl font-bold text-slate-900">
          端末セットアップ
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          管理画面で発行した端末トークンを入力してください。
        </p>
        <input
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="端末トークン"
          className="mb-4 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
        />
        <button
          disabled={busy || !tokenInput.trim()}
          onClick={handleSetup}
          className="w-full rounded-xl bg-blue-600 py-4 font-bold tracking-wide text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? '確認中…' : 'この端末を設定'}
        </button>
        {DEV_PREVIEW && (
          <button
            onClick={startDevPreview}
            className="mt-4 w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
          >
            開発プレビュー（サンプルで表示・記録はしません）
          </button>
        )}
      </Shell>
    );
  }

  if (stage === 'select') {
    return (
      <Shell>
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
          利用者ログイン
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前で検索…"
          className="mb-5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
        />
        <div className="flex max-h-[350px] flex-col gap-3 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              利用者がいません。
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => pickUser(u)}
                className="rounded-xl border border-slate-200 bg-white py-[18px] text-lg font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg"
              >
                {u.name}
              </button>
            ))
          )}
        </div>
        <button
          onClick={resetDevice}
          className="mt-7 w-full text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          端末設定を変更
        </button>
      </Shell>
    );
  }

  if (stage === 'pin' && selected) {
    return (
      <Shell>
        <div className="flex flex-col items-center">
          <div className="mb-6 rounded-full bg-emerald-50 px-6 py-3 text-xl font-bold text-emerald-800">
            {selected.name}
          </div>

          <div className="mb-10 mt-4 flex gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`size-5 rounded-full transition-colors ${
                  pin.length > i ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="grid w-72 grid-cols-3 gap-5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                onClick={() => pressKey(n)}
                className="aspect-square rounded-full border border-slate-200 bg-slate-50 font-mono text-3xl font-medium text-slate-800 transition active:scale-90 active:bg-slate-300"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="text-base font-semibold text-slate-500"
            >
              クリア
            </button>
            <button
              onClick={() => pressKey('0')}
              className="aspect-square rounded-full border border-slate-200 bg-slate-50 font-mono text-3xl font-medium text-slate-800 transition active:scale-90 active:bg-slate-300"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="text-base font-semibold text-slate-500"
            >
              削除
            </button>
          </div>

          <button
            onClick={backToSelect}
            className="mt-8 text-sm font-medium text-slate-400 hover:text-slate-600"
          >
            名前を選び直す
          </button>
        </div>
      </Shell>
    );
  }

  if (stage === 'clock' && selected) {
    const alerts = board?.alerts;
    const hasAlerts =
      !!alerts && (alerts.rejected.length > 0 || alerts.reasonNeeded.length > 0);
    return (
      <Shell>
        {hasAlerts && (
          <div className="mb-5 space-y-2">
            {alerts!.rejected.map((r) => (
              <div
                key={`rej-${r.date}`}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {r.date} の予定申請が差し戻されました。個人ページから再申請してください。
              </div>
            ))}
            {alerts!.reasonNeeded.map((n) => (
              <div
                key={`${n.date}-${n.kind}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                <span>
                  {n.date} の{REASON_LABEL[n.kind]}理由が未入力です
                </span>
                <button
                  onClick={() => {
                    setReasonItem({ date: n.date, kind: n.kind });
                    setReasonText('');
                  }}
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  理由を入力
                </button>
              </div>
            ))}
          </div>
        )}

        {board?.needsHealthInput && (
          <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4">
            <p className="text-sm font-bold text-indigo-800">
              今月の体重を入力してください（月1回）
            </p>
            <div className="mt-3 flex items-stretch gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={kioskWeight}
                onChange={(e) => setKioskWeight(e.target.value)}
                placeholder="体重 (kg)"
                className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-base font-bold text-slate-800 outline-none focus:border-indigo-400"
              />
              <button
                onClick={doHealth}
                disabled={busy || !kioskWeight}
                className="rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                記録
              </button>
            </div>
          </div>
        )}

        <h2 className="mb-3 text-center text-xl font-bold text-slate-800">
          {selected.name} さん
        </h2>
        <div className="text-center text-sm font-semibold uppercase tracking-[2px] text-slate-500">
          {dateStr}
        </div>
        <div className="mb-8 mt-3 text-center font-mono text-6xl font-bold tracking-tight text-slate-900">
          {timeStr}
        </div>

        <div className="flex flex-col gap-4">
          {today && today.clockedIn && today.clockedOut ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-center text-lg font-semibold text-slate-600">
              本日はすでに通所・退所を記録済みです
            </div>
          ) : today && today.clockedIn ? (
            <button
              onClick={() => doClock('out')}
              disabled={busy}
              className="w-full rounded-2xl bg-red-400 py-6 text-xl font-bold tracking-[2px] text-white shadow-lg shadow-red-400/20 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-50"
            >
              退所
            </button>
          ) : (
            <button
              onClick={() => doClock('in')}
              disabled={busy}
              className="w-full rounded-2xl bg-emerald-500 py-6 text-xl font-bold tracking-[2px] text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-50"
            >
              通所
            </button>
          )}
        </div>

        {/* 本日の予定（通所・退所・中抜け・食事をすべて表示） */}
        <div className="mt-8 border-t border-slate-200 pt-5">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            本日の予定
          </div>
          <PlanRow
            label="通所予定"
            value={<span className="font-mono">{board?.today.planIn ?? '—'}</span>}
          />
          <PlanRow
            label="退所予定"
            value={<span className="font-mono">{board?.today.planOut ?? '—'}</span>}
          />
          <BreakRows breaks={board?.today.breaks ?? []} />
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-slate-500">食事</span>
            {board?.today.meal ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600">あり</span>
                {board.today.meal.status === 'eaten' ? (
                  <button
                    onClick={() => doMeal(false)}
                    disabled={busy}
                    className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-200 disabled:opacity-50"
                  >
                    喫食済（取消）
                  </button>
                ) : (
                  <button
                    onClick={() => doMeal(true)}
                    disabled={busy}
                    className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    食事をいただきました
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-400">なし</span>
            )}
          </div>
        </div>

        <button
          onClick={backToSelect}
          className="mt-6 w-full text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          {today && today.clockedIn && today.clockedOut ? '戻る' : 'キャンセル'}
        </button>

        {reasonModal}
      </Shell>
    );
  }

  if (stage === 'result' && result) {
    return (
      <Shell>
        <div className="py-6 text-center">
          <div className="mb-2 text-2xl font-bold text-slate-900">
            {result.user.name} さん
          </div>
          <div className="text-lg font-semibold text-slate-700">
            {result.type === 'in' ? '通所' : '退所'}を記録しました
          </div>
          <div className="mt-1 font-mono text-3xl font-bold text-slate-900">
            {result.time}
          </div>
          {result.alreadyDone && (
            <div className="mt-3 text-sm text-slate-500">
              （すでに打刻済みです）
            </div>
          )}
          {(result.isLate || result.isEarlyLeave) && (
            <div className="mt-4 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-sm font-bold text-amber-700">
              {result.isLate ? '遅刻' : ''}
              {result.isEarlyLeave ? '早退' : ''}
            </div>
          )}
          <div className="mt-6 text-sm font-medium text-slate-400">
            {reasonItem ? '理由を入力するか、スキップしてください' : 'まもなく画面が戻ります…'}
          </div>
        </div>

        {/* 退所時：次回の通所予定を表示 */}
        {result.type === 'out' &&
          (board?.nextVisit ? (
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
              <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                次回の予定（{formatVisitDate(board.nextVisit.date)}）
              </div>
              <PlanRow
                label="通所予定"
                value={<span className="font-mono">{board.nextVisit.planIn ?? '—'}</span>}
              />
              <PlanRow
                label="退所予定"
                value={<span className="font-mono">{board.nextVisit.planOut ?? '—'}</span>}
              />
              <BreakRows breaks={board.nextVisit.breaks} />
              {board.nextVisit.practicePlace && (
                <PlanRow
                  label="実習先"
                  value={
                    <span className="font-bold text-violet-600">
                      {board.nextVisit.practicePlace}
                    </span>
                  }
                />
              )}
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-500">食事</span>
                <span
                  className={`text-sm font-bold ${board.nextVisit.mealReserved ? 'text-orange-600' : 'text-slate-400'}`}
                >
                  {board.nextVisit.mealReserved ? 'あり' : 'なし'}
                </span>
              </div>
            </div>
          ) : (
            board && (
              <div className="mt-2 text-center text-sm text-slate-400">
                次回の通所予定はありません
              </div>
            )
          ))}

        {!reasonItem && (
          <button
            onClick={backToSelect}
            className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50"
          >
            戻る
          </button>
        )}

        {reasonModal}
      </Shell>
    );
  }

  return null;
}
