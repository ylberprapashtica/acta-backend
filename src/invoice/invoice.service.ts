import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Article } from '../article/article.entity';
import { Company } from '../company/company.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as htmlPdf from 'html-pdf-node';
import { Options } from 'html-pdf-node';

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(date: string | Date) {
  return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper('formatNumber', function(number: number | string) {
  return Number(number).toFixed(2);
});

@Injectable()
export class InvoiceService {
  private templateCache: { [key: string]: Handlebars.TemplateDelegate } = {};

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  private async loadTemplate(templateName: string): Promise<Handlebars.TemplateDelegate> {
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }

    const templatePath = path.resolve(__dirname, 'invoice', 'templates', templateName);
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    this.templateCache[templateName] = template;
    return template;
  }

  private formatCompanyDetails(company: Company) {
    return [
      { label: 'Trade Name', value: company.tradeName },
      { label: 'Business Type', value: company.businessType },
      { label: 'VAT Number', value: company.vatNumber },
      { label: 'Fiscal Number', value: company.fiscalNumber },
      { label: 'Business Number', value: company.businessNumber },
      { label: 'Unique ID', value: company.uniqueIdentificationNumber },
      { label: 'Registration Date', value: company.registrationDate ? new Date(company.registrationDate).toLocaleDateString() : null },
      { label: 'Address', value: company.address },
      { label: 'Municipality', value: company.municipality },
      { label: 'Phone', value: company.phoneNumber },
      { label: 'Email', value: company.email },
      { label: 'Bank Account', value: company.bankAccount }
    ];
  }

  async createInvoice(data: {
    issuerId: string;
    recipientId: string;
    items: Array<{
      articleId: number;
      quantity: number;
      unitPrice?: number;
    }>;
    issueDate?: Date;
  }, tenantId?: string) {
    const issuer = await this.companyRepository.findOne({ 
      where: { id: data.issuerId },
      relations: ['tenant']
    });
    const recipient = await this.companyRepository.findOne({ 
      where: { id: data.recipientId },
      relations: ['tenant']
    });

    if (!issuer || !recipient) {
      throw new NotFoundException('Issuer or recipient company not found');
    }

    // Check tenant access
    if (tenantId) {
      if (issuer.tenantId !== tenantId || recipient.tenantId !== tenantId) {
        throw new ForbiddenException('You do not have access to one or both of these companies');
      }
    }

    // Create invoice items first to calculate totals
    const invoiceItems = await Promise.all(
      data.items.map(async (item) => {
        const article = await this.articleRepository.findOne({ 
          where: { id: item.articleId },
          relations: ['company']
        });
        if (!article) {
          throw new NotFoundException(`Article with ID ${item.articleId} not found`);
        }

        // Check if article belongs to the same tenant
        if (tenantId && article.company.tenantId !== tenantId) {
          throw new ForbiddenException(`You do not have access to article ${item.articleId}`);
        }

        const invoiceItem = this.invoiceItemRepository.create({
          article,
          quantity: item.quantity,
          unitPrice: item.unitPrice || article.basePrice,
        });

        return this.invoiceItemRepository.save(invoiceItem);
      }),
    );

    // Calculate totals
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalVat = invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0);

    const issueDate = data.issueDate 
      ? typeof data.issueDate === 'string' 
        ? new Date(data.issueDate)
        : data.issueDate
      : new Date();
    
    // Create and save invoice with totals
    const invoice = this.invoiceRepository.create({
      issuer,
      recipient,
      issueDate,
      dueDate: new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from issue date
      invoiceNumber: `INV-${Date.now()}`,
      totalAmount,
      totalVat,
      items: invoiceItems,
    });

    return this.invoiceRepository.save(invoice);
  }

  async getInvoices(paginationDto?: PaginationDto, tenantId?: string): Promise<PaginatedResponse<Invoice>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 100;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.issuer', 'issuer')
      .leftJoinAndSelect('invoice.recipient', 'recipient')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.article', 'article');

    if (tenantId) {
      queryBuilder.where('(issuer.tenantId = :tenantId OR recipient.tenantId = :tenantId)', { tenantId });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('invoice.issueDate', 'DESC')
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

  async getInvoice(id: number, tenantId?: string) {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.issuer', 'issuer')
      .leftJoinAndSelect('invoice.recipient', 'recipient')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.article', 'article')
      .where('invoice.id = :id', { id });

    if (tenantId) {
      queryBuilder.andWhere('(issuer.tenantId = :tenantId OR recipient.tenantId = :tenantId)', { tenantId });
    }

    const invoice = await queryBuilder.getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async getInvoicesByCompany(companyId: string, paginationDto?: PaginationDto, tenantId?: string): Promise<PaginatedResponse<Invoice>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 100;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.issuer', 'issuer')
      .leftJoinAndSelect('invoice.recipient', 'recipient')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.article', 'article')
      .where('(issuer.id = :companyId OR recipient.id = :companyId)', { companyId });

    if (tenantId) {
      queryBuilder.andWhere('(issuer.tenantId = :tenantId OR recipient.tenantId = :tenantId)', { tenantId });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('invoice.issueDate', 'DESC')
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

  async generatePdf(invoiceId: number, tenantId?: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId, tenantId);

    // Ensure all required data is present
    if (!invoice.issuer || !invoice.recipient || !invoice.items || invoice.items.length === 0) {
      throw new Error('Invoice data is incomplete');
    }

    const template = await this.loadTemplate('base.html');
    const html = template({
      invoice,
      logoUrl: invoice.issuer.logo ? `${process.env.API_URL}/uploads/companies/${invoice.issuer.logo}` : null
    });

    try {
      const options: Options = {
        format: 'A4',
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
        printBackground: true,
        preferCSSPageSize: true,
      };

      const file = await htmlPdf.generatePdf({ content: html }, options) as unknown as Buffer;
      return file;
    } catch (error) {
      throw new Error('Failed to generate PDF');
    }
  }
} 