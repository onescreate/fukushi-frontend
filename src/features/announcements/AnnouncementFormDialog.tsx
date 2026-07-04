import { useEffect, useState, type FormEvent } from 'react';
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
import { getApiErrorMessage } from '../../lib/errors';
import {
  AUDIENCE_LABELS,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  type Announcement,
  type AnnouncementAudience,
} from './api';

const textareaCls =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const pad = (n: number) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  facilityId,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  target?: Announcement | null;
}) {
  const isEdit = !!target;
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [publishedOn, setPublishedOn] = useState(today());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(target?.title ?? '');
      setBody(target?.body ?? '');
      setAudience(target?.audience ?? 'all');
      setPublishedOn(target?.publishedOn ?? today());
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data = { title, body, audience, publishedOn };
    try {
      if (isEdit && target) {
        await update.mutateAsync({ facilityId, id: target.id, data });
        toast.success('お知らせを更新しました');
      } else {
        await create.mutateAsync({ facilityId, data });
        toast.success('お知らせを投稿しました');
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'お知らせを編集' : 'お知らせを投稿'}</DialogTitle>
          <DialogDescription>配信対象を選んで掲示します。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="an-title">タイトル</Label>
            <Input
              id="an-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="an-body">本文</Label>
            <textarea
              id="an-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
              maxLength={2000}
              className={textareaCls}
            />
          </div>

          <div className="space-y-1.5">
            <Label>配信対象</Label>
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(Object.entries(AUDIENCE_LABELS) as [AnnouncementAudience, string][]).map(
                ([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAudience(v)}
                    className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                      audience === v
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="an-date">掲載日</Label>
            <Input
              id="an-date"
              type="date"
              value={publishedOn}
              onChange={(e) => setPublishedOn(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">この日以降に表示されます。</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
