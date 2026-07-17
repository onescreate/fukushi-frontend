import type { ReactNode } from 'react';

/** 各ページ共通の見出し（タイトル＋説明＋右側アクション） */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-slate-200 pb-3">
      <div>
        <h1 className="text-[20px] font-black tracking-tight text-slate-800">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[12.5px] font-semibold text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
