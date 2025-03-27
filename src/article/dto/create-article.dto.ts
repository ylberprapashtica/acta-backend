import { IsString, IsNumber, IsEnum, IsUUID } from 'class-validator';
import { VatCode } from '../article.entity';

export class CreateArticleDto {
  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsString()
  code: string;

  @IsEnum(VatCode)
  vatCode: VatCode;

  @IsNumber()
  basePrice: number;

  @IsUUID()
  companyId: string;
} 