import { PageHeader } from './PageHeader';
import { Card } from '@/components/ui/card';

/** 「全店舗」選択中に、店舗ごとの設定ページで店舗選択を促す表示。 */
export function SelectStorePrompt({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
        このページは店舗ごとの設定です。ヘッダーで店舗を選択してください。
      </Card>
    </div>
  );
}
