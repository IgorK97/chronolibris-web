import { Navigate, Outlet } from 'react-router-dom';
import { USER_ROLES, useStore } from '../stores/globalStore';

export const ProtectedRoute = () => {
  const { user, isInitialized } = useStore();

  if (!isInitialized) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export const ModeratorRoute = () => {
  const { user, isInitialized } = useStore();

  if (!isInitialized) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Читатели и администраторы на страницу модерации не попадают
  if (user.role !== USER_ROLES.MODERATOR) {
    return <Navigate to="/library" replace />;
  }

  return <Outlet />;
};
