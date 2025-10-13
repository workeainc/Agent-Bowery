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
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string;
    permissions: Permission[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    organizationId: string;
    permissions: Permission[];
  }
}
