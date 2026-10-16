import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Glasses } from 'lucide-react';

export const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center animate-pulse">
            <Glasses className="w-8 h-8 text-teal-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-teal-400 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Carregando prontuário e dados clínicos...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
