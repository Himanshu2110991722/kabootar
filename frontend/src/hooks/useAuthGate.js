import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function useAuthGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (fn) => {
    if (user) {
      fn();
    } else {
      toast('Sign in to continue 🔐');
      navigate('/login', { state: { from: location.pathname } });
    }
  };
}
