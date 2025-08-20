import { useAuth } from '../contexts/AuthContext';
import { register, login, logout } from '../services/auth';

export const useFirebaseAuth = () => {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    isLoading,
    register,
    login,
    logout,
  };
};