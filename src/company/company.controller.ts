import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './entities/company.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { FileUploadService } from './file-upload.service';

@Controller('companies')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Company>> {
    return this.companyService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: Partial<CreateCompanyDto>,
  ): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.companyService.remove(id);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('id') id: string,
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
    return this.companyService.update(id, { logo: fileName });
  }

  @Delete(':id/logo')
  async removeLogo(@Param('id') id: string): Promise<Company> {
    const company = await this.companyService.findOne(id);
    if (company.logo) {
      await this.fileUploadService.deleteLogo(company.logo);
    }
    return this.companyService.update(id, { logo: null });
  }
} 