'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserData {
  name: string;
  email: string;
  phone: string;
  loginAt: string;
  playerId?: string;
  verified?: boolean;
  verifiedAt?: number;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('user_data');
    localStorage.removeItem('terms_accepted');
    localStorage.removeItem('terms_accepted_at');
    // Limpar também dados de verificação
    localStorage.removeItem('userVerified');
    localStorage.removeItem('userPlayerId');
    localStorage.removeItem('userData');
    localStorage.removeItem('verificationData');
    localStorage.removeItem('verificationExpiry');
    setIsAuthenticated(false);
    setUserData(null);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const authenticated = localStorage.getItem('user_authenticated') === 'true';
      const termsAccepted = localStorage.getItem('terms_accepted') === 'true';
      const userDataStr = localStorage.getItem('user_data');

      if (authenticated && termsAccepted && userDataStr) {
        try {
          const data = JSON.parse(userDataStr);
          setUserData(data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('[Auth] Erro ao carregar dados do usuário:', error);
          logout();
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    setLoading(false);
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      const data = JSON.parse(userDataStr);
      setUserData(data);
    }
  }, []);

  return {
    isAuthenticated,
    userData,
    loading,
    login,
    logout
  };
}
