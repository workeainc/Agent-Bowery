import * as jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: string;
  organizationId: string;
  email?: string;
  role?: string;
}

export function extractAuthUser(req: any): AuthUser | null {
  const isDev = process.env.DEV_MODE === 'true';
  console.log('🔍 extractAuthUser called, DEV_MODE:', isDev);
  
  // Development mode: Use dev token
  if (isDev) {
    const devToken = req.headers['authorization']?.replace('Bearer ', '');
    console.log('🔑 Dev token found:', devToken ? 'Yes' : 'No');
    if (devToken) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
        const payload = jwt.verify(devToken, secret) as any;
        console.log('✅ Token verified, payload:', payload);
        return {
          userId: payload.userId || payload.sub || 'dev-user-123',
          organizationId: payload.orgId || payload.organizationId || 'dev-org-456',
          email: payload.email,
          role: payload.role || payload.roles?.[0]
        };
      } catch (e) {
        console.warn('Dev token verification failed:', e);
      }
    }
    
    // Fallback to hardcoded dev user
    console.log('🔄 Using fallback dev user');
    return {
      userId: 'dev-user-123',
      organizationId: 'dev-org-456'
    };
  }
  
  // Production mode: Extract from NextAuth JWT
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const payload = jwt.verify(token, secret) as any;
    
    return {
      userId: payload.sub || payload.userId,
      organizationId: payload.organizationId,
      email: payload.email,
      role: payload.role
    };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}
