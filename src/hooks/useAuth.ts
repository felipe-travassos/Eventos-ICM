import { useAuth } from '../contexts/AuthContext';
import { register, login, logout } from '../services/auth';

export const useFirebaseAuth = () => {
    const { user } = useAuth();

    return {
        user,
        register,
        login,
        logout,
    };
};