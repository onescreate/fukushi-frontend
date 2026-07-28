import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// バックエンド(NestJS)へのHTTPクライアント
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// リクエストごとに、ログイン中ユーザーのFirebase IDトークンを自動付与する。
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンス共通処理：認証切れ(401)を検知したらサインアウトしてログイン画面へ誘導する。
// ・二重リダイレクト防止のフラグを持つ（連続401でも1回だけ）。
// ・kiosk(独自トークン)とログイン画面自身は対象外＝ループやタブレットの誤サインアウトを防ぐ。
// ・/fukushi 配下で配信されるため BASE_URL を前置する。
// ・エラーメッセージのトーストは各画面が個別に出すため、ここでは行わない（二重表示防止）。
let redirectingToLogin = false;
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 && !redirectingToLogin && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isKiosk = path.includes('/kiosk');
      const onLogin = path.endsWith('/login');
      if (!isKiosk && !onLogin) {
        redirectingToLogin = true;
        const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // 例: /fukushi
        const loginPath = path.includes('/my') ? '/my/login' : '/login';
        try {
          await signOut(auth);
        } catch {
          /* サインアウト失敗は無視して誘導だけ行う */
        }
        window.location.assign(`${base}${loginPath}`);
      }
    }
    return Promise.reject(error);
  },
);
