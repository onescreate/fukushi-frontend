import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios' // ★追加：axiosをインポート
import Portal from './pages/Portal'
import AdminDashboard from './pages/AdminDashboard'
// ★追加：新しく作った管理者ログイン画面を読み込む
import AdminLogin from './pages/AdminLogin' 
import FacilityLogin from './pages/FacilityLogin'
import FacilityDashboard from './pages/FacilityDashboard'
import PersonalLogin from './pages/PersonalLogin'
import PersonalDashboard from './pages/PersonalDashboard.jsx'

// ====================================================
// ★追加：すべてのAPI通信に自動で身分証(トークン)を持たせる共通ルール
// ====================================================
axios.interceptors.request.use((config) => {
  // 通信先のURLを見て、管理者用か利用者用か判断する
  let token = null;
  if (config.url.includes('/api/admin')) {
    token = localStorage.getItem('adminToken');
  } else if (config.url.includes('/api/user')) {
    token = localStorage.getItem('userToken');
  }

  // トークンを持っていれば、HTTPリクエストのヘッダーに「Bearer トークン」という国際標準の形で貼り付ける
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// ====================================================

// ★修正：管理者の通行証の名前を 'adminToken' に変更
function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken')
  return token ? children : <Navigate to="/admin-login" />
}

function UserPrivateRoute({ children }) {
  const token = localStorage.getItem('userToken')
  return token ? children : <Navigate to="/" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      
      {/* ★修正：古い画面を消して、新しく作った AdminLogin を表示する */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      
      <Route path="/facility-login" element={<FacilityLogin />} />
      <Route path="/facility" element={<UserPrivateRoute><FacilityDashboard /></UserPrivateRoute>} />
      
      <Route path="/personal-login" element={<PersonalLogin />} />
      <Route path="/personal" element={<UserPrivateRoute><PersonalDashboard /></UserPrivateRoute>} />
    </Routes>
  )
}

export default App