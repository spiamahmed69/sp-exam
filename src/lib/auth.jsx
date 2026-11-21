import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getToken, setOnUnauthorized, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    const t = getToken();
    if (t) api.post('/auth/logout', {}).catch(() => {});
    setToken('');
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setToken('');
      setUser(null);
    });
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {
        setToken('');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.post('/auth/login', { email, password });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password, role = 'student') => {
    const d = await api.post('/auth/register', { name, email, password, role });
    return d;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthed: !!user }),
    [user, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Redirects to /login when not authenticated. */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8 text-sm text-slate-500">Checking your session…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

/** Redirects unless the user has one of the given roles. */
export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page is for {roles.join(' / ')} accounts. You are signed in as a {user.role}.
        </p>
      </div>
    );
  }
  return children;
}
