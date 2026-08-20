import { useEffect, useState, type FormEvent } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '../../lib/errors';
import { useFacility } from '../../contexts/FacilityContext';
import { useCreateDevice } from './api';

export function DeviceRegisterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 店舗の選択肢は全画面共通のもの（福祉事業所として指定済み・有効な店舗のみ）を使う。
  // 未指定の店舗に端末を登録できてしまうのを防ぐため、ヘッダーの店舗切替と同じ一覧に揃える。
  const { facilities } = useFacility();
  const create = useCreateDevice();

  const [facilityId, setFacilityId] = useState('');
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFacilityId('');
      setLabel('');
      setToken('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await create.mutateAsync({ facilityId, label });
      setToken(res.token); // 登録完了 → トークンを一度だけ表示
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    toast.success('端末トークンをコピーしました');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {token ? (
          <>
            <DialogHeader>
              <DialogTitle>端末トークンを設定してください</DialogTitle>
              <DialogDescription>
                このトークンは<strong>今だけ</strong>表示されます。タブレットのセットアップ画面に入力してください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
                <code className="flex-1 break-all text-sm">{token}</code>
                <Button type="button" variant="outline" size="icon-sm" onClick={copy}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                閉じると二度と表示できません。控えるかコピーしてください。
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>完了</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>タブレット端末を登録</DialogTitle>
              <DialogDescription>
                店舗に置くタブレットを登録します。
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>設置店舗</Label>
                <Select
                  items={Object.fromEntries(
                    (facilities ?? []).map((f) => [f.id, f.name]),
                  )}
                  value={facilityId || null}
                  onValueChange={(v) => setFacilityId((v as string) ?? '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="店舗を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(facilities ?? []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dev-label">端末名</Label>
                <Input
                  id="dev-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  placeholder="玄関タブレット"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? '登録中…' : '登録してトークン発行'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
