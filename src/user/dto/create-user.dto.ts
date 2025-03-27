import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../user.entity';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  tenantId?: string;
} 