// ポータル(会計フロント)のベースURL。SystemSwitcher と同じ環境変数を流用（末尾スラッシュ除去）。
const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || '').replace(/\/$/, '');

/**
 * 会計ポータルの画面を「窓」（iframe）として埋め込む共通ページ。
 * タスク/カレンダーは会計ポータルの /embed/* を表示する（サイドバー無し・担当者/メンバーの選択肢は福祉権限者に限定）。
 * 認証はポータルと同一オリジン（management.ones-create.net/fukushi）＝ログイン共有のため再ログイン不要。
 * 枠・余白は付けず、メイン領域いっぱい（全画面）に表示する（AppLayout側で isFullBleed 指定）。
 */
export default function EmbeddedPage({ title, path }: { title: string; path: string }) {
  if (!PORTAL_URL) {
    return (
      <div className="m-4 rounded-xl border border-[#ECEDF1] bg-white p-8 text-center text-[13px] font-medium text-slate-400">
        ポータルURL（環境変数 VITE_PORTAL_URL）が未設定のため表示できません。
      </div>
    );
  }
  return (
    <iframe
      src={`${PORTAL_URL}${path}`}
      title={title}
      className="w-full flex-1 border-0"
    />
  );
}
