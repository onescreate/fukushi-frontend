import { Navigate, useSearchParams } from 'react-router-dom';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMealBilling, type BillingRow } from '../features/meals/billingApi';
import { useActiveInvoiceSetting } from '../features/meals/invoiceApi';

const pad = (n: number) => String(n).padStart(2, '0');
const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

function Invoice({
  row,
  year,
  month,
  issuer,
}: {
  row: BillingRow;
  year: number;
  month: number;
  issuer: ReturnType<typeof useActiveInvoiceSetting>['data'];
}) {
  return (
    <div className="invoice mx-auto max-w-2xl bg-white p-10 text-slate-800">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-widest">請求書</h1>

      <div className="flex justify-between">
        <div className="text-sm">
          <p className="border-b border-slate-400 pb-1 text-lg font-semibold">
            {row.userName} 様
          </p>
          <p className="mt-3 text-slate-600">
            {year}年{month}月分 食事代として、下記のとおりご請求申し上げます。
          </p>
          <div className="mt-4 inline-block border-2 border-slate-700 px-4 py-2">
            <span className="text-xs text-slate-500">ご請求金額（税込）</span>
            <div className="text-2xl font-bold">{yen(row.total)}</div>
          </div>
        </div>
        <div className="text-right text-sm leading-relaxed">
          {issuer ? (
            <>
              <p className="text-base font-bold">{issuer.issuerName}</p>
              {issuer.postalCode && <p>〒{issuer.postalCode}</p>}
              {issuer.address && <p>{issuer.address}</p>}
              {issuer.phone && <p>TEL: {issuer.phone}</p>}
              {issuer.registrationNumber && (
                <p className="mt-1">登録番号: {issuer.registrationNumber}</p>
              )}
            </>
          ) : (
            <p className="text-rose-500">※発行者情報が未設定です</p>
          )}
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left">項目</th>
            <th className="border border-slate-300 px-3 py-2 text-center w-24">数量</th>
            <th className="border border-slate-300 px-3 py-2 text-right w-32">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-3 py-2">食事代 ※軽減税率(8%)対象</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{row.mealCount}食</td>
            <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{yen(row.mealTotal)}</td>
          </tr>
          {row.cancelTotal > 0 && (
            <tr>
              <td className="border border-slate-300 px-3 py-2">キャンセル料</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{row.cancelCount}件</td>
              <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{yen(row.cancelTotal)}</td>
            </tr>
          )}
          <tr>
            <td className="border border-slate-300 bg-slate-50 px-3 py-2 text-right font-medium" colSpan={2}>
              8%対象 小計（税抜）
            </td>
            <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{yen(row.subtotal)}</td>
          </tr>
          <tr>
            <td className="border border-slate-300 bg-slate-50 px-3 py-2 text-right font-medium" colSpan={2}>
              消費税（{row.taxRate ?? 8}%）
            </td>
            <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{yen(row.taxAmount)}</td>
          </tr>
          <tr>
            <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-right font-bold" colSpan={2}>
              合計（税込）
            </td>
            <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-right font-bold tabular-nums">
              {yen(row.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {issuer?.bankInfo && (
        <div className="mt-6 text-sm">
          <p className="font-semibold">お振込先</p>
          <p className="whitespace-pre-wrap text-slate-600">{issuer.bankInfo}</p>
        </div>
      )}
      {row.note && (
        <div className="mt-4 text-sm">
          <p className="font-semibold">備考</p>
          <p className="whitespace-pre-wrap text-slate-600">{row.note}</p>
        </div>
      )}
    </div>
  );
}

export default function InvoicePrintPage() {
  const { firebaseUser, loading } = useAuth();
  const [params] = useSearchParams();
  const facilityId = params.get('facilityId') ?? '';
  const year = Number(params.get('year'));
  const month = Number(params.get('month'));
  const userId = params.get('userId'); // 個別発行のとき

  const { data, isLoading } = useMealBilling(facilityId, year, month);
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;
  const { data: issuer } = useActiveInvoiceSetting(facilityId, monthEnd);

  if (!loading && !firebaseUser) return <Navigate to="/login" replace />;

  const rows = (data?.rows ?? []).filter((r) => !userId || r.userId === userId);

  return (
    <div className="min-h-screen bg-slate-200 py-6">
      {/* 画面のみ表示するツールバー（印刷時は隠す） */}
      <div className="no-print mx-auto mb-4 flex max-w-2xl items-center justify-between px-4">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow hover:bg-slate-50"
        >
          <X className="size-4" />
          閉じる
        </button>
        <span className="text-sm text-slate-500">
          {year}年{month}月・{rows.length}件
        </span>
        <button
          onClick={() => window.print()}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          <Printer className="size-4" />
          印刷 / PDF保存
        </button>
      </div>

      {isLoading ? (
        <p className="py-20 text-center text-slate-500">読み込み中…</p>
      ) : rows.length === 0 ? (
        <p className="py-20 text-center text-slate-500">対象の請求がありません。</p>
      ) : (
        <div className="print-area space-y-6">
          {rows.map((r) => (
            <div key={r.userId} className="invoice-page">
              <Invoice row={r} year={year} month={month} issuer={issuer} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .invoice-page { page-break-after: always; }
          .invoice-page:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}
