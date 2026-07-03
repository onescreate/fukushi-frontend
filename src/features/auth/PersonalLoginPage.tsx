import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginIdToEmail } from '../../lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PersonalLoginPage() {
  const { login, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && firebaseUser) {
    return <Navigate to="/my" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(loginIdToEmail(loginId), password);
      navigate('/my', { replace: true });
    } catch {
      setError('ログインIDまたはパスワードが正しくありません');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
            福
          </div>
          <h1 className="text-lg font-bold text-slate-800">
            就労支援 利用者ページ
          </h1>
          <p className="mt-1 text-sm text-slate-500">ご本人用ログイン</p>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="p-login">ログインID</Label>
              <Input
                id="p-login"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-pw">パスワード</Label>
              <Input
                id="p-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'ログイン中…' : 'ログイン'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          職員の方は{' '}
          <Link to="/login" className="text-indigo-600 underline">
            こちらからログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
