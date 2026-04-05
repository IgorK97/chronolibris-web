import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../stores/globalStore';

interface ProtectedRouteProps {
  allowedRoles?: ('moderator' | 'admin' | 'reader')[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isInitialized } = useStore();

  if (!isInitialized) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as 'moderator' | 'admin' | 'reader')) {
    return <Navigate to="/library" replace />;
  }

  return <Outlet />;
};

// export const ModeratorRoute = () => {
//   const { user, isInitialized } = useStore();

//   if (!isInitialized) return null;

//   if (!user) {
//     return <Navigate to="/auth" replace />;
//   }

//   if (user.role !== USER_ROLES.MODERATOR) {
//     return <Navigate to="/library" replace />;
//   }

//   return <Outlet />;
// };
