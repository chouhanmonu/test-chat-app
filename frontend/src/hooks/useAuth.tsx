import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../api/axios';

type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  const setAccessToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    setAccessTokenState(token);
  };

  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  const value = useMemo(() => ({ accessToken, setAccessToken }), [accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
