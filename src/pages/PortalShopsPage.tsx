import { toast } from 'sonner';
import { Loader2, Store } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
  usePortalShops,
  useDesignateShop,
  useUndesignateShop,
  SERVICE_TYPE_LABELS,
  type PortalShop,
  type ServiceType,
} from '../features/portal/api';
import { getApiErrorMessage } from '../lib/errors';

export default function PortalShopsPage() {
  const { data, isLoading } = usePortalShops();
  const designate = useDesignateShop();
  const undesignate = useUndesignateShop();
  const busy = designate.isPending || undesignate.isPending;

  const toggle = async (shop: PortalShop) => {
    try {
      if (shop.designated) {
        await undesignate.mutateAsync(shop.shopId);
        toast.success('福祉事業所の指定を解除しました');
      } else {
        await designate.mutateAsync({
          shopId: shop.shopId,
          serviceType: shop.serviceType,
          mealsEnabled: shop.mealsEnabled,
        });
        toast.success('福祉事業所に指定しました');
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const save = async (shop: PortalShop, patch: Partial<PortalShop>) => {
    try {
      await designate.mutateAsync({
        shopId: shop.shopId,
        serviceType: patch.serviceType ?? shop.serviceType,
        mealsEnabled: patch.mealsEnabled ?? shop.mealsEnabled,
      });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const shops = data?.shops ?? [];

  return (
    <div>
      <PageHeader
        title="事業所の設定"
        description="ポータルの店舗から福祉事業所を指定します（店舗名・法人はポータルが最新）"
      />

      {data && !data.enabled ? (
        <Card className="px-6 py-12 text-center">
          <Store className="mx-auto size-8 text-slate-300" />
          <p className="mt-2 text-[13px] font-bold text-slate-500">
            ポータル連携が無効です
          </p>
          <p className="mt-1 text-[12px] font-medium text-slate-400">
            バックエンドに PORTAL_DATABASE_URL が設定されていません。
          </p>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-slate-300" />
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店舗名</TableHead>
                <TableHead>法人</TableHead>
                <TableHead>区分</TableHead>
                <TableHead className="text-center">福祉事業所</TableHead>
                <TableHead>サービス種別</TableHead>
                <TableHead className="text-center">食事</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                    ポータルに店舗がありません。
                  </TableCell>
                </TableRow>
              )}
              {shops.map((s) => (
                <TableRow key={s.shopId} className={s.designated ? 'bg-indigo-50/30' : ''}>
                  <TableCell className="font-bold text-slate-800">{s.name}</TableCell>
                  <TableCell className="text-slate-500">{s.corpName ?? '—'}</TableCell>
                  <TableCell className="text-[11px] text-slate-400">
                    {s.businessCategory ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggle(s)}
                      title={s.designated ? '解除' : '福祉事業所にする'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                        s.designated ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                          s.designated ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <select
                      value={s.serviceType ?? ''}
                      disabled={!s.designated || busy}
                      onChange={(e) =>
                        save(s, { serviceType: (e.target.value || null) as ServiceType | null })
                      }
                      className="h-8 rounded-lg border border-[#E3E4EA] bg-white px-2 text-[12.5px] font-semibold text-slate-800 outline-none hover:border-[#D3D4DC] focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-300"
                    >
                      <option value="">（未設定）</option>
                      {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((k) => (
                        <option key={k} value={k}>
                          {SERVICE_TYPE_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={s.mealsEnabled}
                      disabled={!s.designated || busy}
                      onChange={(e) => save(s, { mealsEnabled: e.target.checked })}
                      className="size-4 accent-indigo-600 disabled:opacity-30"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
