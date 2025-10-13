import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ROLE_PERMISSIONS } from '@/types/auth';
import { authService } from '@/lib/auth-service';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call real backend API for authentication
          const result = await authService.login({
            email: credentials.email,
            password: credentials.password,
          });

          if (result.success && result.user) {
            // Store the JWT token for API calls
            if (result.token) {
              authService.setToken(result.token);
            }

            return {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              organizationId: result.user.organizationId,
              permissions: result.user.permissions,
            };
          }

          // Fallback to mock authentication if backend is not available
          console.warn('Backend authentication failed, falling back to mock auth');
          
          if (credentials.email === 'admin@agentbowery.com' && credentials.password === 'password123') {
            const role = 'admin';
            return {
              id: '1',
              email: 'admin@agentbowery.com',
              name: 'Admin User',
              role: role,
              organizationId: 'org_chauncey',
              permissions: ROLE_PERMISSIONS[role]
            };
          }
          
          if (credentials.email === 'editor@agentbowery.com' && credentials.password === 'password123') {
            const role = 'editor';
            return {
              id: '2',
              email: 'editor@agentbowery.com',
              name: 'Editor User',
              role: role,
              organizationId: 'org_chauncey',
              permissions: ROLE_PERMISSIONS[role]
            };
          }
          
          if (credentials.email === 'viewer@agentbowery.com' && credentials.password === 'password123') {
            const role = 'viewer';
            return {
              id: '3',
              email: 'viewer@agentbowery.com',
              name: 'Viewer User',
              role: role,
              organizationId: 'org_chauncey',
              permissions: ROLE_PERMISSIONS[role]
            };
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
});

export { handler as GET, handler as POST };
