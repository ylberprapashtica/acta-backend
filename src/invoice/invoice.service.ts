import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Article } from '../entities/article.entity';
import { Company } from '../company/entities/company.entity';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

// Use require for PDFKit
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
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

  async generatePdf(id: number): Promise<Buffer> {
    const invoice = await this.getInvoice(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return new Promise((resolve) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add header with background
      doc.rect(0, 0, doc.page.width, 120).fill('#f8fafc');
      doc.fontSize(24).fillColor('#111827').text('INVOICE', { align: 'center', y: 50 });
      
      // Add invoice details in header
      doc.fontSize(10).fillColor('#6b7280');
      const headerDetailsY = 80;
      doc.text(`Invoice Number: `, 50, headerDetailsY)
         .fillColor('#111827')
         .text(`#${invoice.invoiceNumber}`, 130, headerDetailsY);
      
      doc.fillColor('#6b7280')
         .text(`Issue Date: `, 50, headerDetailsY + 15)
         .fillColor('#111827')
         .text(new Date(invoice.issueDate).toLocaleDateString(), 130, headerDetailsY + 15);
      
      doc.fillColor('#6b7280')
         .text(`Due Date: `, 50, headerDetailsY + 30)
         .fillColor('#111827')
         .text(new Date(invoice.dueDate).toLocaleDateString(), 130, headerDetailsY + 30);

      // Company Information Section
      const companyStartY = 150;
      
      // From Company Box
      doc.rect(50, companyStartY, 240, 250)
         .fillAndStroke('#ffffff', '#e5e7eb');
      doc.fontSize(14).fillColor('#111827')
         .text('From', 70, companyStartY + 15);
      
      doc.fontSize(12).fillColor('#111827')
         .text(invoice.issuer.businessName, 70, companyStartY + 40, { bold: true });
      
      const issuerDetails = [
        { label: 'Trade Name', value: invoice.issuer.tradeName },
        { label: 'Business Type', value: invoice.issuer.businessType },
        { label: 'VAT Number', value: invoice.issuer.vatNumber },
        { label: 'Fiscal Number', value: invoice.issuer.fiscalNumber },
        { label: 'Business Number', value: invoice.issuer.businessNumber },
        { label: 'Unique ID', value: invoice.issuer.uniqueIdentificationNumber },
        { label: 'Registration Date', value: invoice.issuer.registrationDate ? new Date(invoice.issuer.registrationDate).toLocaleDateString() : null },
        { label: 'Address', value: invoice.issuer.address },
        { label: 'Municipality', value: invoice.issuer.municipality },
        { label: 'Phone', value: invoice.issuer.phoneNumber },
        { label: 'Email', value: invoice.issuer.email },
        { label: 'Bank Account', value: invoice.issuer.bankAccount }
      ];

      let yOffset = companyStartY + 65;
      issuerDetails.forEach(detail => {
        if (detail.value) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(`${detail.label}: `, 70, yOffset)
             .fillColor('#111827')
             .text(detail.value, 150, yOffset);
          yOffset += 15;
        }
      });

      // To Company Box
      doc.rect(310, companyStartY, 240, 250)
         .fillAndStroke('#ffffff', '#e5e7eb');
      doc.fontSize(14).fillColor('#111827')
         .text('To', 330, companyStartY + 15);
      
      doc.fontSize(12).fillColor('#111827')
         .text(invoice.recipient.businessName, 330, companyStartY + 40, { bold: true });
      
      const recipientDetails = [
        { label: 'Trade Name', value: invoice.recipient.tradeName },
        { label: 'Business Type', value: invoice.recipient.businessType },
        { label: 'VAT Number', value: invoice.recipient.vatNumber },
        { label: 'Fiscal Number', value: invoice.recipient.fiscalNumber },
        { label: 'Business Number', value: invoice.recipient.businessNumber },
        { label: 'Unique ID', value: invoice.recipient.uniqueIdentificationNumber },
        { label: 'Registration Date', value: invoice.recipient.registrationDate ? new Date(invoice.recipient.registrationDate).toLocaleDateString() : null },
        { label: 'Address', value: invoice.recipient.address },
        { label: 'Municipality', value: invoice.recipient.municipality },
        { label: 'Phone', value: invoice.recipient.phoneNumber },
        { label: 'Email', value: invoice.recipient.email },
        { label: 'Bank Account', value: invoice.recipient.bankAccount }
      ];

      yOffset = companyStartY + 65;
      recipientDetails.forEach(detail => {
        if (detail.value) {
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(`${detail.label}: `, 330, yOffset)
             .fillColor('#111827')
             .text(detail.value, 410, yOffset);
          yOffset += 15;
        }
      });

      // Items Table
      const tableTop = companyStartY + 280;
      doc.rect(50, tableTop, 500, 30).fill('#f8fafc');
      
      // Table Headers
      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Item', 70, tableTop + 10);
      doc.text('Quantity', 250, tableTop + 10);
      doc.text('Unit Price', 350, tableTop + 10);
      doc.text('Total', 450, tableTop + 10);

      // Table Content
      let itemY = tableTop + 40;
      invoice.items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(50, itemY - 5, 500, 25).fill('#f8fafc');
        }
        
        doc.fillColor('#111827').fontSize(10);
        doc.text(item.article.name, 70, itemY);
        doc.text(item.quantity.toString(), 250, itemY);
        doc.text(`€${Number(item.unitPrice).toFixed(2)}`, 350, itemY);
        doc.text(`€${Number(item.totalPrice).toFixed(2)}`, 450, itemY);
        
        itemY += 25;
      });

      // Totals Section
      const totalsY = itemY + 20;
      doc.rect(350, totalsY, 200, 80)
         .fillAndStroke('#ffffff', '#e5e7eb');

      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Subtotal:', 370, totalsY + 15);
      doc.text('VAT:', 370, totalsY + 35);
      doc.text('Total:', 370, totalsY + 55);

      doc.fontSize(10).fillColor('#111827');
      doc.text(`€${Number(invoice.totalAmount - invoice.totalVat).toFixed(2)}`, 450, totalsY + 15, { align: 'right' });
      doc.text(`€${Number(invoice.totalVat).toFixed(2)}`, 450, totalsY + 35, { align: 'right' });
      doc.fontSize(12).fillColor('#111827');
      doc.text(`€${Number(invoice.totalAmount).toFixed(2)}`, 450, totalsY + 55, { align: 'right', bold: true });

      doc.end();
    });
  }
} 