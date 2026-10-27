import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  isComplainant: boolean;
  isOfficer: boolean;
  isBureauAdmin: boolean;
  isSystemAdmin: boolean;
  isReviewer: boolean;
  isStaff: boolean;
  canAssignCase: boolean;
  canApproveResolution: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('synora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('synora_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const freshUser = await api.get<User>('/auth/me');
        setUser(freshUser);
        localStorage.setItem('synora_user', JSON.stringify(freshUser));
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifySession();

    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('synora_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('synora_auth_expired', handleAuthExpired);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('synora_token', newToken);
    localStorage.setItem('synora_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('synora_token');
    localStorage.removeItem('synora_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('synora_user', JSON.stringify(updated));
  };

  const role = user?.role;
  const isComplainant = role === 'complainant';
  const isOfficer = role === 'officer';
  const isBureauAdmin = role === 'bureau_admin';
  const isSystemAdmin = role === 'system_admin';
  const isReviewer = role === 'reviewer';
  const isStaff = !isComplainant && !!role;

  const canAssignCase = isBureauAdmin || isSystemAdmin;
  const canApproveResolution = isBureauAdmin || isSystemAdmin;
  const canManageUsers = isSystemAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isComplainant,
        isOfficer,
        isBureauAdmin,
        isSystemAdmin,
        isReviewer,
        isStaff,
        canAssignCase,
        canApproveResolution,
        canManageUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
