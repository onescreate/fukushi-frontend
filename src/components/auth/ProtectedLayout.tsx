import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import AppLayout from '../layout/AppLayout';
import ErrorReportButton from '../ErrorReportButton';
// 「質問はこちら」（使い方をAIに聞く）。入口はこのボタン1つだけです。
import AiChatLauncher from '../help/AiChatLauncher';
import AiChatPanel from '../help/AiChatPanel';

/** 未ログインなら /login へ。利用者なら個人ページへ。職員なら管理画面。 */
export default function ProtectedLayout() {
  const { firebaseUser, loading } = useAuth();
  const { data: me, isLoading } = useMe();
  const [chatOpen, setChatOpen] = useState(false);   // 「質問はこちら」の開閉

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
      {/* 「質問はこちら」。答えの元になるのは福祉の説明書（config/helpTopics.ts）です。
          職員の画面にだけ出します（利用者は上で個人ページへ移るため、ここには来ません）。 */}
      <AiChatLauncher onOpen={() => setChatOpen(true)} hidden={chatOpen} />
      {chatOpen && <AiChatPanel onClose={() => setChatOpen(false)} />}
    </>
  );
}
