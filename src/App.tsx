import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminGuard } from '@/auth/AdminGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/common/states';
import LoginPage from '@/pages/Login';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const UsersPage = lazy(() => import('@/pages/Users'));
const UserDetailPage = lazy(() => import('@/pages/UserDetail'));
const UserManagementPage = lazy(() => import('@/pages/UserManagement'));
const ReferralsPage = lazy(() => import('@/pages/Referrals'));
const SlotTreePage = lazy(() => import('@/pages/SlotTree'));
const SlotPurchasesPage = lazy(() => import('@/pages/SlotPurchases'));
const IncomePage = lazy(() => import('@/pages/Income'));
const ActivityPage = lazy(() => import('@/pages/Activity'));
const OnChainPage = lazy(() => import('@/pages/OnChain'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AdminGuard />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/manage" element={<UserManagementPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="slots/tree" element={<SlotTreePage />} />
            <Route path="slots/purchases" element={<SlotPurchasesPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="onchain" element={<OnChainPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
