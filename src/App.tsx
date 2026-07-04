import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedLayout from './components/auth/ProtectedLayout';
import { RequirePerm } from './components/auth/RequirePerm';
import LoginPage from './features/auth/LoginPage';
import PersonalLoginPage from './features/auth/PersonalLoginPage';
import PersonalProtected from './components/auth/PersonalProtected';
import PersonalSchedulePage from './pages/personal/PersonalSchedulePage';
import PersonalMealPage from './pages/personal/PersonalMealPage';
import PersonalHistoryPage from './pages/personal/PersonalHistoryPage';
import KioskPage from './pages/KioskPage';
import DashboardPage from './pages/DashboardPage';
import HelpPage from './pages/HelpPage';
import SchedulesPage from './pages/SchedulesPage';
import ApprovalsPage from './pages/ApprovalsPage';
import RosterPage from './pages/RosterPage';
import AttendanceSettingsPage from './pages/AttendanceSettingsPage';
import MealPricingPage from './pages/MealPricingPage';
import TaxSettingsPage from './pages/TaxSettingsPage';
import MealReservationsPage from './pages/MealReservationsPage';
import MealApprovalsPage from './pages/MealApprovalsPage';
import MealBillingPage from './pages/MealBillingPage';
import InvoiceSettingsPage from './pages/InvoiceSettingsPage';
import InvoicePrintPage from './pages/InvoicePrintPage';
import MealDeliveryPage from './pages/MealDeliveryPage';
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

      {/* 請求書印刷（サイドバーなしの独立ページ・自前で認証チェック） */}
      <Route path="/meal-billing/print" element={<InvoicePrintPage />} />

      {/* 利用者本人の個人ページ */}
      <Route path="/my/login" element={<PersonalLoginPage />} />
      <Route path="/my" element={<PersonalProtected />}>
        <Route index element={<PersonalSchedulePage />} />
        <Route path="meals" element={<PersonalMealPage />} />
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
        <Route
          path="/meal-pricing"
          element={
            <RequirePerm perm="settings.price">
              <MealPricingPage />
            </RequirePerm>
          }
        />
        <Route
          path="/tax-settings"
          element={
            <RequirePerm perm="settings.tax">
              <TaxSettingsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/meal-reservations"
          element={
            <RequirePerm perm="meal.view">
              <MealReservationsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/meal-approvals"
          element={
            <RequirePerm perm="meal.manage">
              <MealApprovalsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/meal-billing"
          element={
            <RequirePerm perm="billing.view">
              <MealBillingPage />
            </RequirePerm>
          }
        />
        <Route
          path="/invoice-settings"
          element={
            <RequirePerm perm="billing.issue">
              <InvoiceSettingsPage />
            </RequirePerm>
          }
        />
        <Route
          path="/meal-deliveries"
          element={
            <RequirePerm perm="meal.delivery.manage">
              <MealDeliveryPage />
            </RequirePerm>
          }
        />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
