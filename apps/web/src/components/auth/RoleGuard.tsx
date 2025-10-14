'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { UserRole, Permission, hasPermission, hasRole, hasAnyRole, hasAnyPermission } from '@/types/auth';

interface RoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles. If false, user needs ANY.
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback = null,
  showFallback = false,
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Show loading while session is loading
  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Show fallback if no session
  if (!session?.user) {
    return showFallback ? <>{fallback}</> : null;
  }

  const user = session.user;

  // Check role requirements
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll 
      ? roles.every(role => hasRole(user, role))
      : hasAnyRole(user, roles);
  }

  // Check permission requirements
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.every(permission => hasPermission(user, permission))
      : hasAnyPermission(user, permissions);
  }

  // User has access if they meet both role and permission requirements
  const hasAccess = hasRequiredRoles && hasRequiredPermissions;

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={['admin']} fallback={fallback} showFallback={!!fallback}>
      {children}
    </RoleGuard>
  );
}

export function EditorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={['admin', 'editor']} fallback={fallback} showFallback={!!fallback}>
      {children}
    </RoleGuard>
  );
}

export function ViewerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={['admin', 'editor', 'viewer']} fallback={fallback} showFallback={!!fallback}>
      {children}
    </RoleGuard>
  );
}

// Permission-based components
export function ContentManager({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      permissions={['content:create', 'content:edit']} 
      fallback={fallback} 
      showFallback={!!fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function Publisher({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      permissions={['content:publish']} 
      fallback={fallback} 
      showFallback={!!fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function UserManager({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      permissions={['users:manage']} 
      fallback={fallback} 
      showFallback={!!fallback}
    >
      {children}
    </RoleGuard>
  );
}


