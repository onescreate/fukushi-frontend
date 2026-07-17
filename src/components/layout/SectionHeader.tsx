import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** KGI調のセクション見出し（アイコン＋タイトル＋右側スロット・下線）。 */
export function SectionHeader({
  icon: Icon,
  title,
  right,
}: {
  icon?: LucideIcon;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-200 pb-2">
      {Icon && <Icon className="size-4 text-slate-400" />}
      <h2 className="text-[14px] font-bold text-slate-800">{title}</h2>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
