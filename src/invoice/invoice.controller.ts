import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { Invoice } from './invoice.entity';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/user.entity';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(Role.USER)
  createInvoice(@Body() data: {
    issuerId: string;
    recipientId: string;
    items: Array<{
      articleId: number;
      quantity: number;
      unitPrice?: number;
    }>;
    issueDate?: Date;
  }, @Tenant() tenantId: string) {
    return this.invoiceService.createInvoice(data, tenantId);
  }

  @Get()
  @Roles(Role.USER)
  getInvoices(@Query() paginationDto: PaginationDto, @Tenant() tenantId: string): Promise<PaginatedResponse<Invoice>> {
    return this.invoiceService.getInvoices(paginationDto, tenantId);
  }

  @Get(':id')
  @Roles(Role.USER)
  getInvoice(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.invoiceService.getInvoice(+id, tenantId);
  }

  @Get('company/:companyId')
  @Roles(Role.USER)
  getInvoicesByCompany(
    @Param('companyId') companyId: string,
    @Query() paginationDto: PaginationDto,
    @Tenant() tenantId: string
  ): Promise<PaginatedResponse<Invoice>> {
    return this.invoiceService.getInvoicesByCompany(companyId, paginationDto, tenantId);
  }

  @Get(':id/pdf')
  @Roles(Role.USER)
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Tenant() tenantId: string
  ) {
    const buffer = await this.invoiceService.generatePdf(+id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
    });
    res.send(buffer);
  }
} 