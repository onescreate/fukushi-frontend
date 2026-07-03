import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedLayout from './components/auth/ProtectedLayout';
import { RequirePerm } from './components/auth/RequirePerm';
import LoginPage from './features/auth/LoginPage';
import PersonalLoginPage from './features/auth/PersonalLoginPage';
import PersonalProtected from './components/auth/PersonalProtected';
import PersonalSchedulePage from './pages/personal/PersonalSchedulePage';
import PersonalHistoryPage from './pages/personal/PersonalHistoryPage';
import KioskPage from './pages/KioskPage';
import DashboardPage from './pages/DashboardPage';
import HelpPage from './pages/HelpPage';
import SchedulesPage from './pages/SchedulesPage';
import ApprovalsPage from './pages/ApprovalsPage';
import RosterPage from './pages/RosterPage';
import AttendanceSettingsPage from './pages/AttendanceSettingsPage';
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

      {/* 利用者本人の個人ページ */}
      <Route path="/my/login" element={<PersonalLoginPage />} />
      <Route path="/my" element={<PersonalProtected />}>
        <Route index element={<PersonalSchedulePage />} />
        <Route path="history" element={<PersonalHistoryPage />} />
      </Route>

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
        <Route
          path="/schedules"
          element={
            <RequirePerm perm="schedule.view">
              <SchedulesPage />
            </RequirePerm>
          }
        />
        <Route
          path="/approvals"
          element={
            <RequirePerm perm="schedule.approve">
              <ApprovalsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/roster"
          element={
            <RequirePerm perm="attendance.view">
              <RosterPage />
            </RequirePerm>
          }
        />
        <Route
          path="/attendance-settings"
          element={
            <RequirePerm perm="attendance.edit">
              <AttendanceSettingsPage />
            </RequirePerm>
          }
        />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
