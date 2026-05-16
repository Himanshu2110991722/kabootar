import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TripsPage from './pages/TripsPage';
import ParcelsPage from './pages/ParcelsPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import MyParcelsPage from './pages/MyParcelsPage';
import KYCPage from './pages/KYCPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AdminPage from './pages/AdminPage';
import ExplorePage from './pages/ExplorePage';
import NotificationsPage from './pages/NotificationsPage';
import DeleteAccountPage from './pages/DeleteAccountPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
};

// Handles Android hardware back button via React Router
function AndroidBackHandler() {
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let unsub = null;

    import('@capacitor/app').then(({ App }) => {
      const ROOT_PATHS = ['/', '/login'];
      const isRoot = () => ROOT_PATHS.includes(location.pathname);

      const handler = App.addListener('backButton', ({ canGoBack }) => {
        if (isRoot()) {
          // At root — exit the app
          App.exitApp();
        } else {
          // Elsewhere — go back in router history
          navigate(-1);
        }
      });

      unsub = handler;
    });

    return () => {
      unsub?.then?.(h => h.remove()).catch(() => {});
    };
  }, [location.pathname, navigate]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <AndroidBackHandler />
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/parcels" element={<ParcelsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/my-parcels" element={<PrivateRoute><MyParcelsPage /></PrivateRoute>} />
          <Route path="/kyc" element={<PrivateRoute><KYCPage /></PrivateRoute>} />
        </Route>
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(() => {
    if (import.meta.env.DEV) {
      if (sessionStorage.getItem('kabutar_splash_shown')) return true;
      sessionStorage.setItem('kabutar_splash_shown', '1');
    }
    return false;
  });

  // Show onboarding once on very first launch
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem('kabutar_onboarded')
  );

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {splashDone && !onboardingDone && (
        <Onboarding onDone={() => setOnboardingDone(true)} />
      )}

      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1c1917',
                color: '#fafaf9',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Sora, sans-serif',
              },
              success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
