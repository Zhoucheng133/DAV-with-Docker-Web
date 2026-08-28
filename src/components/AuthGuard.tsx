import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api, { type ApiResponse } from '../api';

export function AuthGuard() {
  const [loading, setLoading] = useState(true);
  const [needsInit, setNeedsInit] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndInit = async () => {
      try {
        const initRes = await api.get<ApiResponse<boolean>>('/api/init');
        const isInit = initRes.data.data;
        setNeedsInit(isInit);

        if (isInit) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('dav_token');
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        try {
          const authRes = await api.get<ApiResponse>('/api/auth');
          if (authRes.data && authRes.data.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Guard check error:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndInit();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Loading application...</p>
        </div>
      </div>
    );
  }

  if (needsInit) {
    if (location.pathname !== '/register') {
      return <Navigate to="/register" replace />;
    }
    return <Outlet />;
  }

  if (location.pathname === '/register') {
    return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
  }

  if (location.pathname === '/login') {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
