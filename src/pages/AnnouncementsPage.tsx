import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useUsersFacilityOptions } from '../features/users/api';
import {
  AUDIENCE_LABELS,
  useAnnouncements,
  useDeleteAnnouncement,
  type Announcement,
} from '../features/announcements/api';
import { AnnouncementFormDialog } from '../features/announcements/AnnouncementFormDialog';
import { formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const audienceCls: Record<string, string> = {
  users: 'bg-sky-100 text-sky-700',
  staff: 'bg-violet-100 text-violet-700',
  all: 'bg-slate-100 text-slate-600',
};

export default function AnnouncementsPage() {
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setFacilityId] = useState('');
  const { data: items, isLoading } = useAnnouncements(facilityId);
  const del = useDeleteAnnouncement();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync({ facilityId, id: deleting.id });
      toast.success('お知らせを削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="お知らせ"
        description="利用者・職員へのお知らせを店舗ごとに投稿します。"
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="w-64">
          <Select
            items={Object.fromEntries((facilities ?? []).map((f) => [f.id, f.name]))}
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
        {facilityId && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            お知らせを投稿
          </Button>
        )}
      </div>

      {facilityId && (
        <div className="space-y-3">
          {isLoading ? (
            <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
              読み込み中…
            </Card>
          ) : (items ?? []).length === 0 ? (
            <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
              お知らせがまだありません。
            </Card>
          ) : (
            (items ?? []).map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${audienceCls[a.audience]}`}>
                        {AUDIENCE_LABELS[a.audience]}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(a.publishedOn)}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-foreground">{a.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(a);
                        setFormOpen(true);
                      }}
                      aria-label="編集"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(a)} aria-label="削除">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        facilityId={facilityId}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="お知らせを削除しますか？"
        description={`「${deleting?.title ?? ''}」を削除します。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
