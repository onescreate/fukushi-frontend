import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      // 管理者用のAPIへ送信
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        email: email,
        password: password
      })
      
      // ★ここが超重要：管理者専用の通行証（adminToken）として保存する！
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminName', response.data.admin.name)
      
      // ログイン成功時は管理者ダッシュボードへ
      navigate('/admin')
    } catch (error) {
      setMessage('メールアドレスまたはパスワードが正しくありません')
    }
  }

  return (
    <div style={{ 
      minHeight: '100dvh',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F8FAFC',
      padding: '20px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .glass-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); padding: 48px 40px; width: 100%; max-width: 440px; text-align: center; }
        .input-field { width: 100%; padding: 16px 20px; font-size: 16px; border: 2px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC; color: #0F172A; outline: none; transition: all 0.2s ease; margin-bottom: 20px; }
        .input-field:focus { border-color: #4F46E5; background-color: #FFFFFF; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .submit-btn { width: 100%; background: #4F46E5; color: #FFFFFF; border: none; border-radius: 12px; padding: 18px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); margin-top: 12px; }
        .submit-btn:hover { background: #4338CA; transform: translateY(-2px); box-shadow: 0 8px 15px rgba(79, 70, 229, 0.3); }
      `}</style>

      <div className="glass-card">
        <h2 style={{ fontSize: '24px', color: '#0F172A', marginBottom: '8px', fontWeight: '700' }}>管理者ログイン</h2>
        <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '15px' }}>システム管理者のメールアドレスとパスワードを入力</p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>メールアドレス</label>
          <input 
            type="email" 
            className="input-field" 
            placeholder="admin@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>パスワード</label>
          <input 
            type="password" 
            className="input-field" 
            placeholder="パスワードを入力" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && <div style={{ color: '#EF4444', fontWeight: '600', marginBottom: '16px', textAlign: 'center', backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px' }}>{message}</div>}

          <button type="submit" className="submit-btn">
            ログインする
          </button>
        </form>

        <button onClick={() => navigate('/')} style={{ marginTop: '32px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: '500' }}>
          ← ポータルへ戻る
        </button>
      </div>
    </div>
  )
}

export default AdminLogin