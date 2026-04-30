import { Routes, Route, Navigate } from 'react-router-dom'
import Portal from './pages/Portal'
import AdminDashboard from './pages/AdminDashboard'
// ★追加：新しく作った管理者ログイン画面を読み込む
import AdminLogin from './pages/AdminLogin' 
import FacilityLogin from './pages/FacilityLogin'
import FacilityDashboard from './pages/FacilityDashboard'
import PersonalLogin from './pages/PersonalLogin'
import PersonalDashboard from './pages/PersonalDashboard.jsx'

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