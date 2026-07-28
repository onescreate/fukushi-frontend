import axios from 'axios';
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

// ※ 401時に signOut する共通処理は入れない。
//   福祉は会計ポータルと同一オリジンで Firebase セッションを共有(SSO)しているため、
//   福祉側の signOut がポータルのログインまで巻き込んで落としてしまう。
//   認証切れの誘導が必要なら、signOut せずに扱う方法を別途検討する。
