import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedLayout from './components/auth/ProtectedLayout';
import { RequirePerm } from './components/auth/RequirePerm';
import LoginPage from './features/auth/LoginPage';
import KioskPage from './pages/KioskPage';
import DashboardPage from './pages/DashboardPage';
import CorporationsPage from './pages/masters/CorporationsPage';
import FacilitiesPage from './pages/masters/FacilitiesPage';
import StaffPage from './pages/masters/StaffPage';
import UsersPage from './pages/masters/UsersPage';
import DevicesPage from './pages/masters/DevicesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* タブレット（キオスク）: 認証不要の公開画面 */}
      <Route path="/kiosk" element={<KioskPage />} />

      {/* 認証済みレイアウト（サイドバー＋ヘッダー） */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/corporations"
          element={
            <RequirePerm perm="corporation.manage">
              <CorporationsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/facilities"
          element={
            <RequirePerm perm="store.manage">
              <FacilitiesPage />
            </RequirePerm>
          }
        />
        <Route
          path="/staff"
          element={
            <RequirePerm perm="staff.manage">
              <StaffPage />
            </RequirePerm>
          }
        />
        <Route
          path="/users"
          element={
            <RequirePerm perm="user.view">
              <UsersPage />
            </RequirePerm>
          }
        />
        <Route
          path="/devices"
          element={
            <RequirePerm perm="store.manage">
              <DevicesPage />
            </RequirePerm>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
