import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppStoreProvider, useStore } from './store/AppStore';
import { ToastProvider } from './components/ui';
import PublicLayout from './layouts/PublicLayout';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import PhotographerProfile from './pages/PhotographerProfile';
import BookingRequest from './pages/BookingRequest';
import ForPhotographers from './pages/ForPhotographers';
import { Login, Signup } from './pages/Auth';
import Dashboard from './pages/app/Dashboard';
import Feed from './pages/app/Feed';
import AdminDashboard from './pages/admin/Metrics';
import Bookings from './pages/app/Bookings';
import BookingDetail from './pages/app/BookingDetail';
import Messages from './pages/app/Messages';
import Settings from './pages/app/Settings';
import Calendar from './pages/app/Calendar';
import Services from './pages/app/Services';
import ProfileEdit from './pages/app/ProfileEdit';
import Earnings from './pages/app/Earnings';
import ReviewsPage from './pages/app/ReviewsPage';
import { Applications, AdminPhotographers } from './pages/admin/Applications';
import { Disputes, Transactions } from './pages/admin/Money';
import type { ReactNode } from 'react';
import type { Role } from './data/types';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
    } else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Only({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useStore();
  return user && roles.includes(user.role) ? <>{children}</> : <Navigate to="/app" replace />;
}

function AppIndex() {
  const { user } = useStore();
  return user?.role === 'admin' ? <AdminDashboard /> : <Feed />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStoreProvider>
        <ToastProvider>
          <ScrollTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/photographers" element={<SearchPage />} />
              <Route path="/photographers/:id" element={<PhotographerProfile />} />
              <Route path="/photographers/:id/book" element={<BookingRequest />} />
              <Route path="/for-photographers" element={<ForPhotographers />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/app" element={<AppShell />}>
              <Route index element={<AppIndex />} />
              <Route path="studio" element={<Dashboard />} />
              <Route path="explore" element={<SearchPage />} />
              <Route path="p/:id" element={<PhotographerProfile />} />
              <Route path="p/:id/book" element={<BookingRequest />} />
              <Route path="bookings" element={<Only roles={['client', 'photographer']}><Bookings /></Only>} />
              <Route path="bookings/:id" element={<BookingDetail />} />
              <Route path="messages" element={<Only roles={['client', 'photographer']}><Messages /></Only>} />
              <Route path="messages/:threadId" element={<Only roles={['client', 'photographer']}><Messages /></Only>} />
              <Route path="settings" element={<Only roles={['client', 'photographer']}><Settings /></Only>} />
              <Route path="calendar" element={<Only roles={['photographer']}><Calendar /></Only>} />
              <Route path="services" element={<Only roles={['photographer']}><Services /></Only>} />
              <Route path="profile" element={<Only roles={['photographer']}><ProfileEdit /></Only>} />
              <Route path="earnings" element={<Only roles={['photographer']}><Earnings /></Only>} />
              <Route path="reviews" element={<Only roles={['photographer']}><ReviewsPage /></Only>} />
              <Route path="applications" element={<Only roles={['admin']}><Applications /></Only>} />
              <Route path="photographers" element={<Only roles={['admin']}><AdminPhotographers /></Only>} />
              <Route path="transactions" element={<Only roles={['admin']}><Transactions /></Only>} />
              <Route path="disputes" element={<Only roles={['admin']}><Disputes /></Only>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AppStoreProvider>
    </BrowserRouter>
  );
}
