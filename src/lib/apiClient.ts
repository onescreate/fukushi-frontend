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
