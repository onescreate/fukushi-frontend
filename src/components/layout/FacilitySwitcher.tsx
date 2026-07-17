import { useState } from 'react';
import { Check, ChevronDown, Store } from 'lucide-react';
import { useFacility } from '../../contexts/FacilityContext';

/**
 * ヘッダーの店舗スイッチャー（複数選択）。
 * 全ページ共通の表示対象店舗を切り替える。選択は localStorage に永続化。
 */
export function FacilitySwitcher() {
  const { facilities, selectedIds, setSelectedIds, isAll } = useFacility();
  const [open, setOpen] = useState(false);
  if (facilities.length === 0) return null;

  // 店舗が1つだけなら選択の余地がないので名前だけ表示
  if (facilities.length === 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 text-[12.5px] font-bold text-white/90">
        <Store className="size-4 text-white/60" />
        <span className="max-w-44 truncate">{facilities[0].name}</span>
      </div>
    );
  }

  const allIds = facilities.map((f) => f.id);
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      setSelectedIds(next.length ? next : allIds); // 0件にはせず全店舗に戻す
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const label = isAll
    ? '全店舗'
    : selectedIds.length === 1
      ? (facilities.find((f) => f.id === selectedIds[0])?.name ?? '1店舗')
      : `${selectedIds.length}店舗を選択中`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-bold text-white/90 transition-colors hover:bg-white/10"
      >
        <Store className="size-4 text-white/60" />
        <span className="max-w-44 truncate">{label}</span>
        <ChevronDown className={`size-3.5 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 shadow-[0_18px_44px_-14px_rgba(16,24,40,0.35)]">
            <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              表示する店舗（複数選択可）
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds(allIds)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-bold transition-colors hover:bg-slate-50"
            >
              <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${isAll ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                {isAll && <Check className="size-3" />}
              </span>
              全店舗（合算）
            </button>
            <div className="my-1 border-t border-slate-100" />
            <div className="max-h-72 overflow-y-auto">
              {facilities.map((f) => {
                const checked = selectedIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-slate-50"
                  >
                    <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
