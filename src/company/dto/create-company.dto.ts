import { IsString, IsEnum, IsEmail, IsDateString, IsNotEmpty } from 'class-validator';
import { BusinessType } from '../entities/company.entity';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  tradeName?: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  uniqueIdentificationNumber: string;

  @IsString()
  businessNumber?: string;

  @IsString()
  fiscalNumber?: string;

  @IsString()
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
  bankAccount?: string;
} 