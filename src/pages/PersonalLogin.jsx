import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function PersonalLogin() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      // 裏側は既存のAPIを利用（パスワード欄に入力された文字をPINとして送信）
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, {
        user_id: userId,
        pin_code: password
      })
      localStorage.setItem('userToken', response.data.token)
      localStorage.setItem('userName', response.data.user.name)
      // ログイン成功時は個人のマイページへ
      navigate('/personal')
    } catch (error) {
      setMessage('IDまたはパスワードが正しくありません')
    }
  }

  return (
    <div style={{ 
      minHeight: '100dvh', /* スマホでもPCでも画面いっぱいに */
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F1F5F9',
      padding: '20px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        
        .glass-card {
          background: #FFFFFF;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          padding: 48px 40px;
          width: 100%;
          max-width: 440px; /* PCでも広がりすぎない最適な幅 */
          text-align: center;
        }

        .input-field {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          background-color: #F8FAFC;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
          margin-bottom: 20px;
          -webkit-appearance: none;
        }
        .input-field:focus {
          border-color: #10B981; /* 個人用は緑のテーマカラー */
          background-color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .submit-btn {
          width: 100%;
          background: #10B981;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 18px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
          margin-top: 12px;
        }
        .submit-btn:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(16, 185, 129, 0.3);
        }
      `}</style>

      <div className="glass-card">
        <h2 style={{ fontSize: '24px', color: '#0F172A', marginBottom: '8px', fontWeight: '700' }}>個人ログイン</h2>
        <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '15px' }}>利用者IDとパスワードを入力してください</p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>利用者ID</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="例: user_001" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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

export default PersonalLogin