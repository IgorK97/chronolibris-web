import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/stores/globalStore';

interface PublicOnlyRouteProps {
  redirectTo?: string;
}

export const PublicOnlyRoute = ({
  redirectTo = '/library',
}: PublicOnlyRouteProps) => {
  const { user, isInitialized } = useStore();

  if (!isInitialized) return null;

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
