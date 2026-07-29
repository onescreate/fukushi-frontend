import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Stamp } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFacility } from '../contexts/FacilityContext';
import { SelectStorePrompt } from '../components/layout/SelectStorePrompt';
import {
  useInvoiceIssuer,
  useInvoiceConfig,
  useCorpAccounts,
  useSaveInvoiceConfig,
} from '../features/meals/invoiceApi';
import { pad } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const SOURCE_LABEL: Record<string, { text: string; cls: string }> = {
  portal: { text: 'ポータル法人から自動取得', cls: 'bg-emerald-100 text-emerald-700' },
  legacy: { text: '旧設定を使用', cls: 'bg-amber-100 text-amber-700' },
  none: { text: '未設定', cls: 'bg-rose-100 text-rose-600' },
};

// 「未設定」になった具体的な理由（診断メッセージ）。
const REASON_MESSAGE: Record<string, string> = {
  portal_disabled: 'ポータル連携が無効です（PORTAL_DATABASE_URL 未設定）。',
  no_corp_link:
    'この店舗の法人がポータルに紐付いていません。「事業所の設定」で店舗を福祉事業所として指定すると、法人が紐付きます。',
  corp_query_error:
    '法人情報の参照でエラーが発生しました。福祉DBに「corps」テーブルのSELECT権限があるか確認してください。',
  corp_not_found: 'ポータルに該当する法人（corp）が見つかりませんでした。',
};

export default function InvoiceSettingsPage() {
  const { singleFacilityId } = useFacility();
  const facilityId = singleFacilityId ?? '';
  const { data: issuer } = useInvoiceIssuer(facilityId, todayStr());
  const { data: config } = useInvoiceConfig(facilityId);
  const { data: accountsData } = useCorpAccounts(facilityId);
  const save = useSaveInvoiceConfig();

  const [form, setForm] = useState({
    bankAccountId: '',
    sealEnabled: true,
    issuerNameOverride: '',
    registrationNumberOverride: '',
    postalCodeOverride: '',
    addressOverride: '',
    phoneOverride: '',
    bankInfoOverride: '',
    remark: '',
  });
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        bankAccountId: config.bankAccountId ?? '',
        sealEnabled: config.sealEnabled,
        issuerNameOverride: config.issuerNameOverride ?? '',
        registrationNumberOverride: config.registrationNumberOverride ?? '',
        postalCodeOverride: config.postalCodeOverride ?? '',
        addressOverride: config.addressOverride ?? '',
        phoneOverride: config.phoneOverride ?? '',
        bankInfoOverride: config.bankInfoOverride ?? '',
        remark: config.remark ?? '',
      });
      setShowOverride(
        !!(
          config.issuerNameOverride ||
          config.registrationNumberOverride ||
          config.postalCodeOverride ||
          config.addressOverride ||
          config.phoneOverride ||
          config.bankInfoOverride
        ),
      );
    }
  }, [config]);

  if (!singleFacilityId) return <SelectStorePrompt title="請求書 発行者情報" />;

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      await save.mutateAsync({
        facilityId,
        data: {
          bankAccountId: form.bankAccountId || null,
          sealEnabled: form.sealEnabled,
          issuerNameOverride: form.issuerNameOverride || null,
          registrationNumberOverride: form.registrationNumberOverride || null,
          postalCodeOverride: form.postalCodeOverride || null,
          addressOverride: form.addressOverride || null,
          phoneOverride: form.phoneOverride || null,
          bankInfoOverride: form.bankInfoOverride || null,
          remark: form.remark || null,
        },
      });
      toast.success('請求書設定を保存しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const src = SOURCE_LABEL[issuer?.source ?? 'none'];
  const accounts = accountsData?.accounts ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="請求書 発行者情報"
        description="発行者（法人）情報はポータルの法人から自動で反映されます。振込先口座の選択・社印の有無・必要な場合の上書きだけを設定します。"
      />

      {/* 自動反映される発行者プレビュー */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">請求書に印字される発行者</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${src.cls}`}>
            {src.text}
          </span>
        </div>
        <div className="space-y-1 text-sm text-slate-700">
          <p className="text-base font-bold">{issuer?.issuerName ?? '（未設定）'}</p>
          {issuer?.registrationNumber && <p>登録番号: {issuer.registrationNumber}</p>}
          {issuer?.postalCode && <p>〒{issuer.postalCode}</p>}
          {issuer?.address && <p>{issuer.address}</p>}
          {issuer?.phone && <p>TEL: {issuer.phone}</p>}
          <p className="pt-1">
            振込先: <span className="font-medium">{issuer?.bankInfo ?? '（未選択）'}</span>
          </p>
          <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
            <Stamp className="size-3.5" />
            社印:{' '}
            {issuer?.sealImage
              ? '登録あり（請求書に表示）'
              : form.sealEnabled
                ? 'ポータルに未登録'
                : '非表示'}
          </p>
        </div>
        {issuer && issuer.source === 'none' && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            {REASON_MESSAGE[issuer.reason ?? ''] ??
              '発行者情報を取得できません。ポータルでこの店舗の法人（corp）が設定されているか確認してください。'}
          </p>
        )}
        {issuer?.warnings?.includes('accounts') && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            振込先（口座）を取得できませんでした。福祉DBに「accounts」テーブルのSELECT権限が必要な可能性があります。
          </p>
        )}
        {issuer?.warnings?.includes('seal') && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            社印を取得できませんでした。福祉DBに「ones_accounting_corp_seals」テーブルのSELECT権限が必要な可能性があります。
          </p>
        )}
      </Card>

      {/* 設定 */}
      <Card className="space-y-5 p-5">
        {/* 振込先口座 */}
        <div className="space-y-1.5">
          <Label>振込先口座</Label>
          {accountsData && !accountsData.enabled ? (
            <p className="text-xs text-slate-400">ポータル連携が無効のため、口座を選べません。</p>
          ) : accountsData && accountsData.linked === false ? (
            <p className="text-xs text-amber-600">この店舗の法人がポータルに紐付いていません（事業所の設定で指定してください）。</p>
          ) : accountsData?.error ? (
            <p className="text-xs text-amber-600">口座の取得に失敗しました（accounts テーブルのSELECT権限が必要な可能性）。</p>
          ) : accounts.length === 0 ? (
            <p className="text-xs text-slate-400">この法人に登録された口座がありません（ポータルで登録してください）。</p>
          ) : (
            <select
              value={form.bankAccountId}
              onChange={(e) => set('bankAccountId', e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">（選択しない）</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                  {a.name ? `（${a.name}）` : ''}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-slate-400">
            選んだ口座が請求書の「お振込先」に表示されます。下の上書きで自由入力も可能です。
          </p>
        </div>

        {/* 社印 */}
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.sealEnabled}
            onChange={(e) => set('sealEnabled', e.target.checked)}
            className="size-4"
          />
          <span className="text-sm font-medium text-slate-700">
            社印を請求書に表示する（ポータルに登録があれば）
          </span>
        </label>

        {/* 上書き（任意） */}
        <div>
          <button
            type="button"
            onClick={() => setShowOverride((v) => !v)}
            className="text-sm font-bold text-indigo-600"
          >
            {showOverride ? '▲ 上書き設定を隠す' : '▼ 上書き設定（任意）'}
          </button>
          {showOverride && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="発行者名（上書き）" value={form.issuerNameOverride} onChange={(v) => set('issuerNameOverride', v)} />
              <Field label="登録番号（上書き）" value={form.registrationNumberOverride} onChange={(v) => set('registrationNumberOverride', v)} />
              <Field label="〒郵便番号（上書き）" value={form.postalCodeOverride} onChange={(v) => set('postalCodeOverride', v)} />
              <Field label="TEL（上書き）" value={form.phoneOverride} onChange={(v) => set('phoneOverride', v)} />
              <div className="sm:col-span-2">
                <Field label="住所（上書き）" value={form.addressOverride} onChange={(v) => set('addressOverride', v)} />
              </div>
              <div className="sm:col-span-2">
                <Field label="振込先（自由入力・口座選択より優先）" value={form.bankInfoOverride} onChange={(v) => set('bankInfoOverride', v)} />
              </div>
            </div>
          )}
        </div>

        {/* 備考 */}
        <Field label="備考（請求書に表示・任意）" value={form.remark} onChange={(v) => set('remark', v)} placeholder="お振込手数料はご負担ください 等" />

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending ? '保存中…' : '保存'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
