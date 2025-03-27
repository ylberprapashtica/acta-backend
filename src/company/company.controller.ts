import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './company.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { FileUploadService } from './file-upload.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/user.entity';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles(Role.USER)
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Tenant() tenantId: string,
  ): Promise<Company> {
    return this.companyService.create(createCompanyDto, tenantId);
  }

  @Get()
  @Roles(Role.USER)
  findAll(
    @Query() paginationDto: PaginationDto,
    @Tenant() tenantId: string,
  ): Promise<PaginatedResponse<Company>> {
    return this.companyService.findAll(paginationDto, tenantId);
  }

  @Get(':id')
  @Roles(Role.USER)
  findOne(
    @Param('id') id: string,
    @Tenant() tenantId: string,
  ): Promise<Company> {
    return this.companyService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: Partial<CreateCompanyDto>,
    @Tenant() tenantId: string,
  ): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto, tenantId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(
    @Param('id') id: string,
    @Tenant() tenantId: string,
  ): Promise<void> {
    return this.companyService.remove(id, tenantId);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  @Roles(Role.USER)
  async uploadLogo(
    @Param('id') id: string,
    @Tenant() tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Company> {
    const fileName = await this.fileUploadService.uploadLogo(file);
    return this.companyService.update(id, { logo: fileName }, tenantId);
  }

  @Delete(':id/logo')
  @Roles(Role.USER)
  async removeLogo(
    @Param('id') id: string,
    @Tenant() tenantId: string,
  ): Promise<Company> {
    const company = await this.companyService.findOne(id, tenantId);
    if (company.logo) {
      await this.fileUploadService.deleteLogo(company.logo);
    }
    return this.companyService.update(id, { logo: undefined }, tenantId);
  }
} 