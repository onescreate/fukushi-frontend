import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../layout/AppLayout';

/** 未ログインなら /login へ。ログイン済みなら管理画面レイアウトを表示。 */
export default function ProtectedLayout() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}
