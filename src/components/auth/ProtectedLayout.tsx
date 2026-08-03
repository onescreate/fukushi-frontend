import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import AppLayout from '../layout/AppLayout';
import ErrorReportButton from '../ErrorReportButton';

/** 未ログインなら /login へ。利用者なら個人ページへ。職員なら管理画面。 */
export default function ProtectedLayout() {
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
    return <Navigate to="/login" replace />;
  }
  if (me && me.type === 'user') {
    // 利用者は個人ページへ
    return <Navigate to="/my" replace />;
  }
  return (
    <>
      <AppLayout />
      <ErrorReportButton />
    </>
  );
}
