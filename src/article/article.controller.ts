import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from './article.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('articles')
@UseGuards(TenantGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() createArticleDto: Partial<Article>, @Tenant() tenantId: string) {
    return this.articleService.create(createArticleDto, tenantId);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Tenant() tenantId: string): Promise<PaginatedResponse<Article>> {
    return this.articleService.findAll(paginationDto, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.articleService.findOne(+id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: Partial<Article>, @Tenant() tenantId: string) {
    return this.articleService.update(+id, updateArticleDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.articleService.remove(+id, tenantId);
  }
} 