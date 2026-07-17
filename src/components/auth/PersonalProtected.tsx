import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import PersonalLayout from '../layout/PersonalLayout';

// 開発プレビュー：ログイン無しで利用者画面の見た目を確認できる（VITE_DEV_SCREENS=1のとき）
const DEV_PREVIEW = import.meta.env.VITE_DEV_SCREENS === '1';

/** 利用者本人用エリアの保護。未ログイン→個人ログイン、職員→管理画面へ。 */
export default function PersonalProtected() {
  const { firebaseUser, loading } = useAuth();
  const { data: me, isLoading } = useMe();

  if (loading || (firebaseUser && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }
  // 開発プレビュー中は、未ログイン・職員でもそのまま利用者画面を表示（デザイン確認用・データは空）
  if (DEV_PREVIEW) {
    return <PersonalLayout />;
  }
  if (!firebaseUser) {
    return <Navigate to="/my/login" replace />;
  }
  if (me && me.type !== 'user') {
    // 職員が個人エリアに来た場合は管理画面へ
    return <Navigate to="/" replace />;
  }
  return <PersonalLayout />;
}
