import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Hides admin pages from other users. The server enforces this too; this only
// keeps non-admins from landing on a page whose requests would all fail.
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
