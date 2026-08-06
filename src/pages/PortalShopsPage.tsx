import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Store, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
// ドロップダウンは福祉システム共通のもの（ブラウザ標準の <select> は使わない）
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  usePortalShops,
  useDesignateShop,
  useUndesignateShop,
  type PortalShop,
} from '../features/portal/api';
import {
  useServiceTypes,
  useCreateServiceType,
  useDeleteServiceType,
} from '../features/service-types/api';
import { getApiErrorMessage } from '../lib/errors';

export default function PortalShopsPage() {
  const { data, isLoading } = usePortalShops();
  const designate = useDesignateShop();
  const undesignate = useUndesignateShop();
  const busy = designate.isPending || undesignate.isPending;

  const { data: serviceTypes = [] } = useServiceTypes();
  const createType = useCreateServiceType();
  const deleteType = useDeleteServiceType();
  const [newType, setNewType] = useState('');

  const addServiceType = async () => {
    const name = newType.trim();
    if (!name) return;
    try {
      await createType.mutateAsync(name);
      setNewType('');
      toast.success('サービス種別を追加しました');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const removeServiceType = async (id: string) => {
    try {
      await deleteType.mutateAsync(id);
      toast.success('サービス種別を削除しました');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

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
    <div className="space-y-8">
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
      ) : (
        <>
          {/* サービス種別の管理 */}
          <section>
            <SectionHeader icon={Plus} title="サービス種別" />
            <p className="mb-3 text-[12px] font-medium text-slate-400">
              事業所に設定できる種別です。自由に追加・削除できます。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {serviceTypes.map((st) => (
                <span
                  key={st.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E4EA] bg-white px-3 py-1 text-[12.5px] font-bold text-slate-700"
                >
                  {st.name}
                  <button
                    type="button"
                    onClick={() => removeServiceType(st.id)}
                    className="text-slate-300 hover:text-rose-500"
                    title="削除"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1.5">
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addServiceType()}
                  placeholder="種別を追加（例: 通所介護）"
                  className="h-8 w-48 rounded-lg border border-[#E3E4EA] bg-white px-3 text-[12.5px] font-semibold text-slate-800 outline-none hover:border-[#D3D4DC] focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={addServiceType}
                  disabled={createType.isPending || !newType.trim()}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-[12px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="size-3.5" /> 追加
                </button>
              </div>
            </div>
          </section>

          {/* 店舗一覧 */}
          <section>
            <SectionHeader icon={Store} title="店舗（ポータル）" />
            {isLoading ? (
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
                          <Select
                            items={{
                              __none__: '（未設定）',
                              ...Object.fromEntries(serviceTypes.map((st) => [st.name, st.name])),
                              // 一覧に無い既存値も選べるように残す
                              ...(s.serviceType &&
                              !serviceTypes.some((st) => st.name === s.serviceType)
                                ? { [s.serviceType]: s.serviceType }
                                : {}),
                            }}
                            value={s.serviceType ?? '__none__'}
                            disabled={!s.designated || busy}
                            onValueChange={(v) =>
                              save(s, { serviceType: v === '__none__' ? null : String(v) })
                            }
                          >
                            <SelectTrigger size="sm" className="h-8 min-w-[9rem]">
                              <SelectValue placeholder="（未設定）" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">（未設定）</SelectItem>
                              {serviceTypes.map((st) => (
                                <SelectItem key={st.id} value={st.name}>
                                  {st.name}
                                </SelectItem>
                              ))}
                              {s.serviceType &&
                                !serviceTypes.some((st) => st.name === s.serviceType) && (
                                  <SelectItem value={s.serviceType}>{s.serviceType}</SelectItem>
                                )}
                            </SelectContent>
                          </Select>
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
          </section>
        </>
      )}
    </div>
  );
}
