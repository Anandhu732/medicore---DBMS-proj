'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessRoute, getCurrentUser } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
  showUnauthorizedMessage?: boolean;
}

/**
 * ProtectedRoute Component
 * Wraps pages and enforces permission-based access control
 * Redirects unauthorized users to fallback path or dashboard
 */
export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  fallbackPath = '/dashboard',
  showUnauthorizedMessage = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAccess = () => {
      const currentUser = getCurrentUser();

      // Not logged in - redirect to login
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // No specific permissions required - allow access
      if (!requiredPermissions || requiredPermissions.length === 0) {
        setIsAuthorized(true);
        return;
      }

      // Check if user has required permissions
      const hasAccess = canAccessRoute(currentUser.role, window.location.pathname);

      if (!hasAccess) {
        if (showUnauthorizedMessage) {
          // Store message in sessionStorage to show on redirect
          sessionStorage.setItem(
            'unauthorized_message',
            'You do not have permission to access this page.'
          );
        }
        router.push(fallbackPath);
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [router, requiredPermissions, fallbackPath, showUnauthorizedMessage]);

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return null; // Router will redirect
  }

  // Authorized - render children
  return <>{children}</>;
}
