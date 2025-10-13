import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DbService } from './db.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  organizationId: string;
  passwordHash?: string; // Only for internal use, never returned to client
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'editor' | 'viewer';
  organizationId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12; // Strong salt rounds for security

  constructor(private readonly dbService: DbService) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, name, role = 'viewer', organizationId = 'org_chauncey' } = createUserDto;

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new ConflictException('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ConflictException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user in database
    const newUser = await this.dbService.createUser({
      email,
      name,
      role,
      organizationId,
      passwordHash,
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Authenticate user login
   */
  async login(loginDto: LoginDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password - handle both camelCase and snake_case
    const passwordHash = (user as any).passwordHash || (user as any).password_hash;
    if (!passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const isPasswordValid = await this.verifyPassword(password, passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.dbService.findUserByEmail(email);
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.dbService.findUserById(id);
    if (!user) return null;

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    // Validate password strength
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ConflictException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update in database
    await this.dbService.updateUserPassword(userId, passwordHash);
  }
}
