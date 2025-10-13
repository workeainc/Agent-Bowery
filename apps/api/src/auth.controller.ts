import { Controller, Get, Post, Body, Query, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { SessionSecurityService } from './services/session-security.service';

// Remove duplicate interfaces - using DTOs from auth.dto.ts

@Controller('auth')
export class AuthController {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

  constructor(
    private readonly authService: AuthService,
    private readonly sessionSecurityService: SessionSecurityService,
  ) {}

  @Get('dev-token')
  getDevToken(@Query('roles') roles?: string) {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      return { error: 'forbidden' };
    }
    const parsedRoles = (roles || 'admin').split(',').map(r => r.trim()).filter(Boolean);
    const token = jwt.sign({ sub: 'dev-user', roles: parsedRoles }, this.jwtSecret, { expiresIn: '1h' });
    return { token, roles: parsedRoles };
  }


  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    try {
      // Use AuthService for authentication
      const user = await this.authService.login(loginDto);

      // Create JWT token
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Create session for security tracking
      const sessionId = this.generateSessionId();
      const clientIp = (req as any).securityContext?.ip || req.ip || 'unknown';
      const userAgent = (req as any).securityContext?.userAgent || req.headers['user-agent'] || 'unknown';
      
      await this.sessionSecurityService.createSession(
        user.id,
        sessionId,
        clientIp,
        userAgent
      );

      return {
        success: true,
        user,
        token,
        sessionId,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Internal server error',
      };
    }
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Use AuthService for user creation
      const newUser = await this.authService.createUser({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        role: registerDto.role || 'viewer',
        organizationId: 'org_chauncey',
      });

      // Create JWT token
      const token = jwt.sign(
        {
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
          organizationId: newUser.organizationId,
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        user: newUser,
        token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Internal server error',
      };
    }
  }

  @Post('logout')
  @UseGuards(GatewayAuthGuard)
  async logout(@Request() req: any) {
    try {
      // Invalidate the session if sessionId is provided
      const sessionId = req.body?.sessionId;
      if (sessionId) {
        await this.sessionSecurityService.invalidateSession(sessionId);
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  async getCurrentUser(@Request() req: any) {
    try {
      // Use AuthService to get user from database
      const user = await this.authService.findUserById(req.user.sub);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  @Post('refresh')
  @UseGuards(GatewayAuthGuard)
  async refreshToken(@Request() req: any) {
    try {
      // Get user from database
      const user = await this.authService.findUserById(req.user.sub);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Create new JWT token
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  private generateSessionId(): string {
    const array = new Uint8Array(16);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}


