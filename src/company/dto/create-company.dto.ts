import { IsString, IsEnum, IsEmail, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { BusinessType } from '../company.entity';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsOptional()
  tradeName?: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  uniqueIdentificationNumber: string;

  @IsString()
  @IsOptional()
  businessNumber?: string;

  @IsString()
  @IsOptional()
  fiscalNumber?: string;

  @IsString()
  @IsOptional()
  vatNumber?: string;

  @IsDateString()
  registrationDate: Date;

  @IsString()
  @IsNotEmpty()
  municipality: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  tenantId: string;
} 