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
      <div></div>
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
