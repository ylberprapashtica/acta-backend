import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(createArticleDto: Partial<Article>, tenantId: string): Promise<Article> {
    // Verify that the company belongs to the tenant
    const company = await this.articleRepository.manager.findOne('company', {
      where: { id: createArticleDto.companyId, tenantId }
    });

    if (!company) {
      throw new ForbiddenException('You can only create articles for companies in your tenant');
    }

    const article = this.articleRepository.create(createArticleDto);
    return await this.articleRepository.save(article);
  }

  async findAll(paginationDto?: PaginationDto, tenantId?: string): Promise<PaginatedResponse<Article>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 100;
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.company', 'company');

    if (tenantId) {
      queryBuilder.where('company.tenantId = :tenantId', { tenantId });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('article.name', 'ASC')
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

  async findOne(id: number, tenantId?: string): Promise<Article> {
    const queryBuilder = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.company', 'company')
      .where('article.id = :id', { id });

    if (tenantId) {
      queryBuilder.andWhere('company.tenantId = :tenantId', { tenantId });
    }

    const article = await queryBuilder.getOne();

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    if (tenantId && article.company.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this article');
    }

    return article;
  }

  async update(id: number, updateArticleDto: Partial<Article>, tenantId: string): Promise<Article> {
    const article = await this.findOne(id, tenantId);

    // If company is being changed, verify it belongs to the tenant
    if (updateArticleDto.companyId && updateArticleDto.companyId !== article.companyId) {
      const newCompany = await this.articleRepository.manager.findOne('company', {
        where: { id: updateArticleDto.companyId, tenantId }
      });

      if (!newCompany) {
        throw new ForbiddenException('You can only assign articles to companies in your tenant');
      }
    }

    Object.assign(article, updateArticleDto);
    return await this.articleRepository.save(article);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const article = await this.findOne(id, tenantId);
    await this.articleRepository.remove(article);
  }
} 