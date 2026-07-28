// ポータル(会計フロント)のベースURL。SystemSwitcher と同じ環境変数を流用（末尾スラッシュ除去）。
const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || '').replace(/\/$/, '');

/**
 * 会計ポータルの画面を「窓」（iframe）として埋め込む共通ページ。
 * タスク/カレンダーは会計ポータルの /embed/* を表示する（サイドバー無し・担当者/メンバーの選択肢は福祉権限者に限定）。
 * 認証はポータルと同一の Firebase プロジェクト。初回のみ窓内でポータルへのログインが必要（以後は自動）。
 * ヘッダーのリンクから開く前提のため、ページ内の見出しは出さず窓のみを表示する。
 */
export default function EmbeddedPage({ title, path }: { title: string; path: string }) {
  if (!PORTAL_URL) {
    return (
      <div className="rounded-xl border border-[#ECEDF1] bg-white p-8 text-center text-[13px] font-medium text-slate-400">
        ポータルURL（環境変数 VITE_PORTAL_URL）が未設定のため表示できません。
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[#ECEDF1] bg-white shadow-[0_1px_2px_rgba(20,20,28,.04)]">
      <iframe
        src={`${PORTAL_URL}${path}`}
        title={title}
        className="h-[calc(100vh-120px)] min-h-[560px] w-full"
      />
    </div>
  );
}
