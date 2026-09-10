// 「質問はこちら」（AIチャット）が使うデータ。
//
// ★考え方：説明書を二重に書きません。
//   中身は config/helpTopics.ts（説明書の画面と同じもの）だけが持ちます。
//   ここでやるのは「チャットが扱える形に並べ替えること」だけです。
//   説明書に1項目足せば、チャットの検索にもAIの回答にも自動で入ります。
//
// ★AIに渡す形（会計ポータルの /ai-chat/answer が受け取る形）は決まっています：
//     id / cat / title / can（できること）/ steps（手順）/ fields（入力項目）/
//     terms（言葉の意味）/ note（注意）/ text（本文）
//   福祉の説明書は「文章＋箇条書き＋ヒント＋注意」でできているので、下のように振り分けます。
import { TOPICS, blockText, catName, type Block, type Topic } from './helpTopics';

export interface ChatItem {
  id: string;
  cat: string;
  title: string;
  kw: string;
  can: string;
  steps: string[];
  fields: never[];
  terms: { t: string; d: string }[];
  note: string;
  text: string;
  /** 画面に出すときは、振り分けた文字ではなく元の本文をそのまま描きます */
  body: Block[];
}

const toItem = (t: Topic): ChatItem => {
  // 先頭が文章なら、それが「これは何か」の一言なので can（できること）に使います。
  const lead = typeof t.body[0] === 'string' ? (t.body[0] as string) : '';
  const rest = t.body.slice(lead ? 1 : 0);

  const steps: string[] = [];
  const terms: { t: string; d: string }[] = [];
  const notes: string[] = [];
  const text: string[] = [];

  for (const b of rest) {
    if (typeof b === 'string') { text.push(b); continue; }
    if ('ol' in b) { b.ol.forEach((o) => steps.push(o.d ? `${o.t}：${o.d}` : o.t)); continue; }
    if ('kv' in b) { b.kv.forEach((x) => terms.push({ t: x.k, d: x.v })); continue; }
    if ('warn' in b) { notes.push(b.warn); continue; }
    if ('h' in b) { text.push(`【${b.h}】`); continue; }
    if ('ul' in b) { b.ul.forEach((u) => text.push(`・${u}`)); continue; }
    if ('tip' in b) { text.push(`※${b.tip}`); continue; }
    if ('table' in b) {
      text.push([b.table.head.join(' / '), ...b.table.rows.map((r) => r.join(' / '))].join('\n'));
      continue;
    }
    const v = blockText(b);
    if (v) text.push(v);
  }

  return {
    id: t.id,
    cat: catName(t.cat),
    title: t.title,
    kw: t.kw,
    can: lead,
    steps,
    fields: [],
    terms,
    note: notes.join('\n'),
    text: text.join('\n'),
    body: t.body,
  };
};

export const CHAT_ITEMS: ChatItem[] = TOPICS.map(toItem);

// 「分野から探す」の入口。説明書の11分類のままでは多いので、聞く側の言葉で6つにまとめます。
export const CHAT_ENTRIES: { id: string; name: string; hint: string; cats: string[] }[] = [
  { id: 'daily', name: '毎日の仕事', hint: '承認・ダッシュボード・打刻の補正', cats: ['毎日の運用（承認・ダッシュボード）', '業務の流れ'] },
  { id: 'kiosk', name: 'タブレット打刻', hint: 'PIN・端末トークン', cats: ['タブレットで打刻'] },
  { id: 'schedule', name: '予定・打刻データ', hint: '通所予定・実習・補正', cats: ['通所予定・打刻データ'] },
  { id: 'meal', name: '食事', hint: '予約・納品・請求・請求書', cats: ['食事（予約・納品・請求）'] },
  { id: 'record', name: '記録・集計', hint: '健康記録・締め業務・分析', cats: ['健康記録・締め業務'] },
  { id: 'setting', name: '設定・困ったとき', hint: '初期設定・マスタ・利用者のページ・Q&A', cats: ['はじめに / 全体像', '初期設定', 'マスタ管理・設定', '利用者のページ（ご本人・ご家族）', '困ったとき（Q&A）'] },
];

// 説明書の項目から、その画面へ直接飛べるようにする対応表。
export const CHAT_JUMP: Record<string, { to: string; label: string }> = {
  'intro-what': { to: '/', label: 'ダッシュボードを開く' },
  'intro-structure': { to: '/portal-shops', label: '事業所の設定を開く' },
  'daily-approve': { to: '/approvals', label: '予定承認を開く' },
  'daily-meal-approve': { to: '/meal-approvals', label: '食事承認を開く' },
  'daily-dashboard': { to: '/', label: 'ダッシュボードを開く' },
  'daily-fix': { to: '/attendance-list', label: '打刻データ一覧を開く' },
  'daily-announce': { to: '/announcements', label: 'お知らせを開く' },
  'schedule-jisshu': { to: '/schedules', label: '通所予定を開く' },
  'meal-reserve': { to: '/meal-reservations', label: '食事予約を開く' },
  'meal-delivery': { to: '/meal-deliveries', label: '食事納品を開く' },
  'meal-billing': { to: '/meal-billing', label: '食事請求を開く' },
  'record-closing': { to: '/closing-operations', label: '締め業務を開く' },
  'record-health': { to: '/health-records', label: '健康記録を開く' },
  'record-analytics': { to: '/analytics', label: '分析を開く' },
  'master-shops': { to: '/portal-shops', label: '事業所の設定を開く' },
  'master-users': { to: '/users', label: '利用者管理を開く' },
  'master-devices': { to: '/devices', label: '端末管理を開く' },
  'master-settings': { to: '/settings', label: '設定を開く' },
  'kiosk-setup': { to: '/devices', label: '端末管理を開く' },
  'faq-portal': { to: '/portal-shops', label: '事業所の設定を開く' },
  'faq-shop-missing': { to: '/portal-shops', label: '事業所の設定を開く' },
  'faq-pin': { to: '/users', label: '利用者管理を開く' },
  'faq-device': { to: '/devices', label: '端末管理を開く' },
  'faq-time-reversed': { to: '/attendance-list', label: '打刻データ一覧を開く' },
};

// 記録がまだ無い初日でも押せるボタンが出るようにする、はじめの並び。
export const CHAT_DEFAULT_FAQ: string[] = [
  'flow-main',
  'daily-approve',
  'daily-dashboard',
  'kiosk-setup',
  'meal-billing',
];
