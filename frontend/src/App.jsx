import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route element={<Layout />}>
        {/* Public routes — accessible without login */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/parcels" element={<ParcelsPage />} />

        {/* Private routes — redirect to /login with return state */}
        <Route path="/messages" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
        <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/my-parcels" element={<PrivateRoute><MyParcelsPage /></PrivateRoute>} />
        <Route path="/kyc" element={<PrivateRoute><KYCPage /></PrivateRoute>} />
      </Route>
      {/* No Layout, no auth guard — pages manage themselves */}
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
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
  );
}
