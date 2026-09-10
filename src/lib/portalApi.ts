// ===========================================
// 会計ポータルのAPIを呼ぶ口（「質問はこちら」が使います）
//
// ★なぜ福祉のAPIではないのか
//   AIチャットのしくみ（説明書から探す→足りなければAIに聞く／1日の回数・1か月の費用の上限／
//   相談の記録）は、会計ポータルのAPIに1か所だけ作ってあります。
//   福祉にも同じものを作ると、上限も費用も記録も二重になり、どちらが本当か分からなくなります。
//
// ★ログインは同じです
//   福祉も会計ポータルも同じFirebaseのアカウントなので、同じ証明書がそのまま通ります。
//   社内かどうかの判定もポータル側で見ています。
//
// ★送信先は不具合報告と同じ（VITE_PORTAL_API_URL）。未設定でも本番URLを既定値にしてあります。
import { auth } from './firebase';

const PORTAL_API = (
  (import.meta.env.VITE_PORTAL_API_URL as string | undefined) ||
  'https://accounting-api-v2-466112053259.asia-northeast1.run.app'
).replace(/\/$/, '');

export const portalApiReady = (): boolean => !!PORTAL_API;

export interface PortalApiError extends Error {
  status?: number;
  detail?: string;
}

/**
 * ポータルのAPIを呼びます。
 * @param path 例 "/ai-chat/faq?system=fukushi"
 * @param opts method / body / timeout（ミリ秒）
 *
 * ★timeout … AIに聞くときは時間がかかります（サーバーは20秒待ちます）。
 *   画面側を短くすると、答えが出ないのに費用と1日の回数だけ減るため、呼ぶ側で長く指定します。
 */
export async function portalApi<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; timeout?: number } = {},
): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout ?? 20000);

  try {
    const res = await fetch(`${PORTAL_API}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* JSONでない応答はそのまま扱います */
    }

    if (!res.ok) {
      const d = data as { error?: string; message?: string; detail?: string } | null;
      const err: PortalApiError = new Error(d?.error || d?.message || `通信に失敗しました（${res.status}）`);
      err.status = res.status;
      err.detail = d?.detail;
      throw err;
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      const err: PortalApiError = new Error('時間がかかりすぎたため中断しました。もう一度お試しください。');
      err.status = 0;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
