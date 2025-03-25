import { Controller, Get, Post, Body, Param, Res, Query, Headers } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Invoice } from '../entities/invoice.entity';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  createInvoice(@Body() data: {
    issuerId: string;
    recipientId: string;
    items: Array<{
      articleId: number;
      quantity: number;
      unitPrice?: number;
    }>;
    issueDate?: Date;
  }) {
    return this.invoiceService.createInvoice(data);
  }

  @Get()
  getInvoices(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<Invoice>> {
    return this.invoiceService.getInvoices(paginationDto);
  }

  @Get(':id')
  getInvoice(@Param('id') id: string) {
    return this.invoiceService.getInvoice(+id);
  }

  @Get('company/:companyId')
  getInvoicesByCompany(
    @Param('companyId') companyId: string,
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponse<Invoice>> {
    return this.invoiceService.getInvoicesByCompany(companyId, paginationDto);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const buffer = await this.invoiceService.generatePdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
    });
    res.send(buffer);
  }
} 