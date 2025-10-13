// Authentication and Authorization Types

export type UserRole = 'admin' | 'editor' | 'viewer';

export type Permission = 
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  | 'content:publish'
  | 'content:approve'
  | 'users:manage'
  | 'settings:manage'
  | 'analytics:view'
  | 'platforms:manage'
  | 'templates:manage'
  | 'brand-rules:manage'
  | 'quality-policies:manage'
  | 'webhooks:manage'
  | 'admin:access';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  expires: string;
}

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'content:create',
    'content:edit',
    'content:delete',
    'content:publish',
    'content:approve',
    'users:manage',
    'settings:manage',
    'analytics:view',
    'platforms:manage',
    'templates:manage',
    'brand-rules:manage',
    'quality-policies:manage',
    'webhooks:manage',
    'admin:access',
  ],
  editor: [
    'content:create',
    'content:edit',
    'content:publish',
    'content:approve',
    'analytics:view',
    'templates:manage',
  ],
  viewer: [
    'analytics:view',
  ],
};

// Helper function to check if user has permission
export function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

// Helper function to check if user has any of the specified permissions
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(permission => user.permissions.includes(permission));
}

// Helper function to check if user has all specified permissions
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(permission => user.permissions.includes(permission));
}

// Helper function to check if user has role
export function hasRole(user: User, role: UserRole): boolean {
  return user.role === role;
}

// Helper function to check if user has any of the specified roles
export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}
