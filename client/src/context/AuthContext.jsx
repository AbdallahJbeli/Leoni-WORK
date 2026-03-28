import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const login = async (matricule, password) => {
    const res = await api.post('/auth/login', { matricule, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Premier login ou reset → forcer changement de mot de passe
    if (userData.must_change_password) {
      navigate('/change-password');
      return;
    }

    const routes = {
      admin:      '/admin',
      demandeur:  '/demandeur',
      technicien: '/technicien',
      qualite:    '/qualite',
    };
    navigate(routes[userData.role] || '/');
  };

  // Appelée depuis ChangePassword après succès
  const afterPasswordChange = () => {
    const updated = { ...user, must_change_password: false };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);

    const routes = {
      admin:      '/admin',
      demandeur:  '/demandeur',
      technicien: '/technicien',
      qualite:    '/qualite',
    };
    navigate(routes[updated.role] || '/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, afterPasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);