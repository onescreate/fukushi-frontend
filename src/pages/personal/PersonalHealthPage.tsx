import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { useMyHealth, useSubmitMyHealth } from '../../features/health/myApi';
import { getApiErrorMessage } from '../../lib/errors';

export default function PersonalHealthPage() {
  const { data } = useMyHealth();
  const submit = useSubmitMyHealth();
  const [weight, setWeight] = useState('');

  const save = async () => {
    const val = Number(weight);
    if (!(val > 0)) {
      toast.error('体重を入力してください');
      return;
    }
    try {
      await submit.mutateAsync(val);
      setWeight('');
      toast.success('体重を記録しました');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-800">
          {data?.month ?? ''}月の体重
        </h2>
        <p className="mt-1 text-[13px] font-medium text-slate-500">
          月に1回、体重を記録してください。
        </p>

        {data?.recorded && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">
            <CheckCircle2 className="size-4" />
            今月は記録済み：{data.weightKg} kg（更新もできます）
          </div>
        )}

        <div className="mt-5">
          <label className="text-[12px] font-bold text-slate-500">体重 (kg)</label>
          <div className="mt-1 flex items-stretch gap-3">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="例: 60.5"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-indigo-400"
            />
            <button
              onClick={save}
              disabled={submit.isPending || !weight}
              className="rounded-xl bg-indigo-600 px-6 text-[15px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              記録
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
