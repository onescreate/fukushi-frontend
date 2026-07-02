import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // すでにログイン済みならホームへ
  if (!loading && firebaseUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            就労支援 利用者管理システム
          </h1>
          <p className="mt-1 text-sm text-slate-500">管理者・スタッフ ログイン</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              メールアドレス
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              placeholder="you@example.com"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              パスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-800 py-2.5 font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
