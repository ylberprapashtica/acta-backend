import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, tenantId: string): Promise<Company> {
    try {
      const company = this.companyRepository.create({
        ...createCompanyDto,
        tenantId,
      });
      return await this.companyRepository.save(company);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation code
        const detail = error.detail || '';
        if (detail.includes('uniqueIdentificationNumber')) {
          throw new ConflictException('A company with this Unique Identification Number already exists');
        } else if (detail.includes('businessNumber')) {
          throw new ConflictException('A company with this Business Number already exists');
        } else if (detail.includes('fiscalNumber')) {
          throw new ConflictException('A company with this Fiscal Number already exists');
        } else if (detail.includes('vatNumber')) {
          throw new ConflictException('A company with this VAT Number already exists');
        }
      }
      throw error;
    }
  }

  async findAll(paginationDto?: PaginationDto, tenantId?: string): Promise<PaginatedResponse<Company>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    if (tenantId) {
      queryBuilder.where('company.tenantId = :tenantId', { tenantId });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('company.businessName', 'ASC')
      .getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage,
        limit,
      },
    };
  }

  async findOne(id: string, tenantId?: string): Promise<Company> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company')
      .where('company.id = :id', { id });

    if (tenantId) {
      queryBuilder.andWhere('company.tenantId = :tenantId', { tenantId });
    }

    const company = await queryBuilder.getOne();

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    if (tenantId && company.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this company');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: Partial<CreateCompanyDto>, tenantId: string): Promise<Company> {
    try {
      const company = await this.findOne(id, tenantId);
      Object.assign(company, updateCompanyDto);
      return await this.companyRepository.save(company);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation code
        const detail = error.detail || '';
        if (detail.includes('uniqueIdentificationNumber')) {
          throw new ConflictException('A company with this Unique Identification Number already exists');
        } else if (detail.includes('businessNumber')) {
          throw new ConflictException('A company with this Business Number already exists');
        } else if (detail.includes('fiscalNumber')) {
          throw new ConflictException('A company with this Fiscal Number already exists');
        } else if (detail.includes('vatNumber')) {
          throw new ConflictException('A company with this VAT Number already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const company = await this.findOne(id, tenantId);
    await this.companyRepository.remove(company);
  }
} 