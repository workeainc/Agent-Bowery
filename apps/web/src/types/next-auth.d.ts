import NextAuth from 'next-auth';
import { UserRole, Permission } from './auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId: string;
      permissions: Permission[];
      createdAt?: string;
      updatedAt?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string;
    permissions: Permission[];
    createdAt?: string;
    updatedAt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    organizationId: string;
    permissions: Permission[];
  }
}
