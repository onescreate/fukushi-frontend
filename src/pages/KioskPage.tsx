import { useEffect, useState } from 'react';
import { Delete, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '../lib/errors';
import {
  fetchKioskUsers,
  kioskAuthenticate,
  kioskToken,
  type KioskUser,
} from '../features/kiosk/api';

type Stage = 'loading' | 'setup' | 'select' | 'pin' | 'success';

export default function KioskPage() {
  const [stage, setStage] = useState<Stage>('loading');
  const [users, setUsers] = useState<KioskUser[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [selected, setSelected] = useState<KioskUser | null>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [successName, setSuccessName] = useState('');

  const loadUsers = async (token: string) => {
    const res = await fetchKioskUsers(token);
    setUsers(res.users);
  };

  // 初期化：保存済みトークンで利用者を読み込む
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

  const pickUser = (u: KioskUser) => {
    setSelected(u);
    setPin('');
    setStage('pin');
  };

  const submitPin = async (value: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await kioskAuthenticate(kioskToken.get(), selected.id, value);
      setSuccessName(res.user.name);
      setStage('success');
      setTimeout(() => {
        setSelected(null);
        setPin('');
        setStage('select');
      }, 2500);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'PINが正しくありません'));
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const pressKey = (k: string) => {
    if (busy) return;
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
  };

  // ---------- 画面 ----------

  if (stage === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        読み込み中…
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-lg font-bold text-slate-800">端末セットアップ</h1>
          <p className="mb-6 text-sm text-slate-500">
            管理画面で発行した端末トークンを入力してください。
          </p>
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="端末トークン"
            className="mb-4"
          />
          <Button
            className="w-full"
            disabled={busy || !tokenInput.trim()}
            onClick={handleSetup}
          >
            {busy ? '確認中…' : 'この端末を設定'}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-50">
        <div className="text-6xl">✅</div>
        <p className="mt-4 text-2xl font-bold text-emerald-800">
          {successName} さん
        </p>
        <p className="mt-2 text-emerald-700">認証しました</p>
        <p className="mt-6 text-sm text-emerald-600/70">
          （打刻機能は次のフェーズで実装します）
        </p>
      </div>
    );
  }

  if (stage === 'pin' && selected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
        <p className="mb-1 text-sm text-slate-500">PINを入力</p>
        <p className="mb-4 text-xl font-bold text-slate-800">{selected.name} さん</p>

        {/* PIN表示 */}
        <div className="mb-6 flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`size-4 rounded-full ${
                i < pin.length ? 'bg-primary' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* キーパッド */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              className="size-20 rounded-lg bg-white text-2xl font-semibold text-slate-800 shadow-sm transition active:scale-95 active:bg-slate-50"
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            className="flex size-20 items-center justify-center rounded-lg bg-slate-200 text-slate-600 transition active:scale-95"
          >
            <Delete className="size-6" />
          </button>
          <button
            onClick={() => pressKey('0')}
            className="size-20 rounded-lg bg-white text-2xl font-semibold text-slate-800 shadow-sm transition active:scale-95 active:bg-slate-50"
          >
            0
          </button>
          <button
            onClick={() => submitPin(pin)}
            disabled={busy || pin.length < 4}
            className="size-20 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            確定
          </button>
        </div>

        <button
          onClick={() => {
            setSelected(null);
            setStage('select');
          }}
          className="mt-8 text-sm text-slate-500 underline"
        >
          もどる
        </button>
      </div>
    );
  }

  // select
  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            お名前を選んでください
          </h1>
          <button
            onClick={resetDevice}
            title="端末設定"
            className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200"
          >
            <Settings className="size-5" />
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-slate-500">この店舗に利用者が登録されていません。</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => pickUser(u)}
                className="rounded-lg border bg-white px-4 py-6 text-lg font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:border-primary/40"
              >
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
