import { pad } from '@/lib/format';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../lib/errors';
import {
  fetchKioskUsers,
  kioskAuthenticate,
  kioskBoard,
  kioskClock,
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
  const [reasonItem, setReasonItem] = useState<{
    date: string;
    kind: ReasonKind;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [result, setResult] = useState<ClockResult | null>(null);
  const [clock, setClock] = useState(new Date());

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
      kioskBoard(operationToken).then(setBoard).catch(() => undefined);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const pickUser = (u: KioskUser) => {
    setSelected(u);
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
    setBusy(true);
    try {
      const res = await kioskClock(operationToken, type);
      setResult(res);
      setStage('result');
      setTimeout(backToSelect, 3500);
    } catch (err) {
      toast.error(getApiErrorMessage(err, '打刻に失敗しました'));
    } finally {
      setBusy(false);
    }
  };

  const doMeal = async (eaten: boolean) => {
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

  const filtered = users.filter((u) => u.name.replace(/\s/g, '').includes(query.replace(/\s/g, '')));

  const timeStr = `${pad(clock.getHours())}:${pad(clock.getMinutes())}`;
  const dateStr = `${clock.getFullYear()}年${clock.getMonth() + 1}月${clock.getDate()}日 (${WEEKDAY[clock.getDay()]})`;

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

        {/* 本日の予定 */}
        <div className="mt-8 border-t border-slate-200 pt-5">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            本日の予定
          </div>
          <div className="flex justify-between border-b border-slate-100 py-3 text-sm">
            <span className="text-slate-500">通所予定</span>
            <span className="font-mono font-semibold text-slate-700">
              {board?.today.planIn ?? '—'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-3 text-sm">
            <span className="text-slate-500">退所予定</span>
            <span className="font-mono font-semibold text-slate-700">
              {board?.today.planOut ?? '—'}
            </span>
          </div>
          {(board?.today.breaks ?? []).map((b, i) => (
            <div
              key={i}
              className="flex justify-between border-b border-slate-100 py-3 text-sm"
            >
              <span className="text-slate-500">中抜け</span>
              <span className="font-mono font-semibold text-slate-700">
                {b.plannedOut ?? '—'} 〜 {b.plannedIn ?? '—'}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-slate-500">食事</span>
            {board?.today.meal ? (
              board.today.meal.status === 'eaten' ? (
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
              )
            ) : (
              <span className="text-xs text-slate-400">予約なし</span>
            )}
          </div>
        </div>

        <button
          onClick={backToSelect}
          className="mt-6 w-full text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          {today && today.clockedIn && today.clockedOut ? '戻る' : 'キャンセル'}
        </button>

        {reasonItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-1 text-lg font-bold text-slate-900">
                {REASON_LABEL[reasonItem.kind]}理由の入力
              </h3>
              <p className="mb-4 text-sm text-slate-500">{reasonItem.date}</p>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                rows={3}
                placeholder="理由を入力してください"
                className="mb-4 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setReasonItem(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600"
                >
                  キャンセル
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
        )}
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
            まもなく画面が戻ります…
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}
