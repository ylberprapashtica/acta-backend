import { Injectable, NotFoundException } from '@nestjs/common';
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

    return article;
  }

  async update(id: number, updateArticleDto: Partial<Article>, tenantId: string): Promise<Article> {
    const article = await this.findOne(id, tenantId);
    Object.assign(article, updateArticleDto);
    return await this.articleRepository.save(article);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const article = await this.findOne(id, tenantId);
    await this.articleRepository.remove(article);
  }
} 