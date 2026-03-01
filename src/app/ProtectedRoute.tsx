import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../stores/globalStore';

export const ProtectedRoute = () => {
  const { user, isInitialized } = useStore();

  if (!isInitialized) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};
