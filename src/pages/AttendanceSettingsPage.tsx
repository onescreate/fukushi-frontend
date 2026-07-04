import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFacility } from '../contexts/FacilityContext';
import { SelectStorePrompt } from '../components/layout/SelectStorePrompt';
import {
  useAttendanceSettings,
  useUpdateAttendanceSettings,
} from '../features/attendance/api';
import { hasPermission, useMe } from '../features/auth/useMe';
import { getApiErrorMessage } from '../lib/errors';

export default function AttendanceSettingsPage() {
  const { data: me } = useMe();
  const canEdit = hasPermission(me, 'attendance.edit');
  const { facilityId, isAll } = useFacility();

  const { data: settings } = useAttendanceSettings(isAll ? '' : facilityId);
  const update = useUpdateAttendanceSettings();

  const [late, setLate] = useState('0');
  const [early, setEarly] = useState('0');

  useEffect(() => {
    if (settings) {
      setLate(String(settings.lateGraceMinutes));
      setEarly(String(settings.earlyLeaveGraceMinutes));
    }
  }, [settings]);

  const save = async () => {
    try {
      await update.mutateAsync({
        facilityId,
        lateGraceMinutes: Number(late) || 0,
        earlyLeaveGraceMinutes: Number(early) || 0,
      });
      toast.success('打刻設定を保存しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (isAll) return <SelectStorePrompt title="打刻設定" />;

  return (
    <div>
      <PageHeader
        title="打刻設定"
        description="遅刻・早退と判定する猶予時間を店舗ごとに設定します。"
      />

      {facilityId && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>猶予時間</CardTitle>
            <CardDescription>
              予定時刻からこの分数を超えたら遅刻・早退と判定します（0＝即判定）。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="late">遅刻の猶予（分）</Label>
              <Input
                id="late"
                type="number"
                min={0}
                max={240}
                value={late}
                onChange={(e) => setLate(e.target.value)}
                disabled={!canEdit}
                className="max-w-32"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="early">早退の猶予（分）</Label>
              <Input
                id="early"
                type="number"
                min={0}
                max={240}
                value={early}
                onChange={(e) => setEarly(e.target.value)}
                disabled={!canEdit}
                className="max-w-32"
              />
            </div>
            {canEdit && (
              <Button onClick={save} disabled={update.isPending}>
                {update.isPending ? '保存中…' : '保存'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
