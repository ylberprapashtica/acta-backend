import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from './article.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/user.entity';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('articles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @Roles(Role.USER)
  create(@Body() createArticleDto: Partial<Article>, @Tenant() tenantId: string) {
    return this.articleService.create(createArticleDto, tenantId);
  }

  @Get()
  @Roles(Role.USER)
  findAll(@Query() paginationDto: PaginationDto, @Tenant() tenantId: string): Promise<PaginatedResponse<Article>> {
    return this.articleService.findAll(paginationDto, tenantId);
  }

  @Get(':id')
  @Roles(Role.USER)
  findOne(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.articleService.findOne(+id, tenantId);
  }

  @Patch(':id')
  @Roles(Role.USER)
  update(@Param('id') id: string, @Body() updateArticleDto: Partial<Article>, @Tenant() tenantId: string) {
    return this.articleService.update(+id, updateArticleDto, tenantId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.articleService.remove(+id, tenantId);
  }
} 