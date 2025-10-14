import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsIn(['admin', 'editor', 'viewer'], { message: 'Role must be one of: admin, editor, viewer' })
  role?: 'admin' | 'editor' | 'viewer';
}

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsIn(['admin', 'editor', 'viewer'], { message: 'Role must be one of: admin, editor, viewer' })
  role?: 'admin' | 'editor' | 'viewer';
}


