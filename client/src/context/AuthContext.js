import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('sd_token');

  const logout = useCallback(() => {
    localStorage.removeItem('sd_token');
    setUser(null);
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('sd_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const token = getToken();
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    return res;
  }, [logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setUser(u); else logout(); })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, authFetch, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
