import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Article } from '../entities/article.entity';
import { Company } from '../company/entities/company.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

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
  }) {
    const issuer = await this.companyRepository.findOne({ where: { id: data.issuerId } });
    const recipient = await this.companyRepository.findOne({ where: { id: data.recipientId } });

    if (!issuer || !recipient) {
      throw new NotFoundException('Issuer or recipient company not found');
    }

    // Create invoice items first to calculate totals
    const invoiceItems = await Promise.all(
      data.items.map(async (item) => {
        const article = await this.articleRepository.findOne({ where: { id: item.articleId } });
        if (!article) {
          throw new NotFoundException(`Article with ID ${item.articleId} not found`);
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

    const issueDate = data.issueDate || new Date();
    
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

  async getInvoices(paginationDto?: PaginationDto): Promise<PaginatedResponse<Invoice>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await this.invoiceRepository.findAndCount({
      skip,
      take: limit,
      relations: ['issuer', 'recipient', 'items', 'items.article'],
      order: {
        issueDate: 'DESC',
      },
    });

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

  async getInvoice(id: number) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['issuer', 'recipient', 'items', 'items.article'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async getInvoicesByCompany(companyId: string, paginationDto?: PaginationDto): Promise<PaginatedResponse<Invoice>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await this.invoiceRepository.findAndCount({
      where: [
        { issuer: { id: companyId } },
        { recipient: { id: companyId } },
      ],
      relations: ['issuer', 'recipient', 'items', 'items.article'],
      skip,
      take: limit,
      order: {
        issueDate: 'DESC',
      },
    });

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

  async generatePdf(id: number, authorizationHeader?: string): Promise<Buffer> {
    const invoice = await this.getInvoice(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const template = await this.loadTemplate('base.html');
    const html = template({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      issuer: {
        businessName: invoice.issuer.businessName,
        details: this.formatCompanyDetails(invoice.issuer)
      },
      recipient: {
        businessName: invoice.recipient.businessName,
        details: this.formatCompanyDetails(invoice.recipient)
      },
      items: invoice.items.map(item => ({
        article: item.article,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toFixed(2),
        totalPrice: Number(item.totalPrice).toFixed(2)
      })),
      totalAmount: Number(invoice.totalAmount).toFixed(2),
      totalVat: Number(invoice.totalVat).toFixed(2)
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set authorization header if provided
      if (authorizationHeader) {
        await page.setExtraHTTPHeaders({
          'Authorization': authorizationHeader
        });
      }

      await page.setContent(html);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '50px',
          right: '50px',
          bottom: '50px',
          left: '50px'
        }
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
} 