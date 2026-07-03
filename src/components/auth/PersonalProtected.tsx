import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import PersonalLayout from '../layout/PersonalLayout';

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
  if (!firebaseUser) {
    return <Navigate to="/my/login" replace />;
  }
  if (me && me.type !== 'user') {
    // 職員が個人エリアに来た場合は管理画面へ
    return <Navigate to="/" replace />;
  }
  return <PersonalLayout />;
}
