import { useState } from 'react'
import axios from 'axios'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Portal from './pages/Portal'
import AdminDashboard from './pages/AdminDashboard'
import FacilityLogin from './pages/FacilityLogin'
import FacilityDashboard from './pages/FacilityDashboard'
import PersonalLogin from './pages/PersonalLogin'
import PersonalDashboard from './pages/PersonalDashboard.jsx' // ★追加：個人用マイページ

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/admin-login" />
}

function UserPrivateRoute({ children }) {
  const token = localStorage.getItem('userToken')
  return token ? children : <Navigate to="/" />
}

function AdminLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        email: email, password: password
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('adminName', response.data.admin.name)
      navigate('/admin')
    } catch (error) {
      setMessage('エラー：メールアドレスかパスワードが違います')
    }
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h2>管理者ログイン</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '15px' }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="メールアドレス" style={{ padding: '8px' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="パスワード" style={{ padding: '8px' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none' }}>ログイン</button>
      </form>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px', background: 'none', border: '1px solid #ccc' }}>← ポータルへ戻る</button>
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route path="/admin-login" element={<AdminLoginScreen />} />
      
      <Route path="/facility-login" element={<FacilityLogin />} />
      <Route path="/facility" element={<UserPrivateRoute><FacilityDashboard /></UserPrivateRoute>} />
      
      <Route path="/personal-login" element={<PersonalLogin />} />
      {/* ★修正：空箱だった場所に作成した画面を配置 */}
      <Route path="/personal" element={<UserPrivateRoute><PersonalDashboard /></UserPrivateRoute>} />

      <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
    </Routes>
  )
}

export default App