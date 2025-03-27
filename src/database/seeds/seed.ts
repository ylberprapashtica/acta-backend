import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TenantService } from '../../tenant/tenant.service';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/company.service';
import { ArticleService } from '../../article/article.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { CreateTenantDto } from '../../tenant/dto/create-tenant.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { BusinessType } from '../../company/company.entity';
import { Role } from '../../user/user.entity';
import { faker } from '@faker-js/faker';
import { CreateCompanyDto } from '../../company/dto/create-company.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const tenantService = app.get(TenantService);
  const userService = app.get(UserService);
  const companyService = app.get(CompanyService);
  const articleService = app.get(ArticleService);
  const invoiceService = app.get(InvoiceService);

  // Create 3 tenants
  const tenants = [];
  for (let i = 0; i < 3; i++) {
    const tenantName = faker.company.name();
    // Create slug from tenant name using only alpha characters
    const tenantSlug = tenantName
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();

    const tenantDto: CreateTenantDto = {
      name: tenantName,
      slug: tenantSlug,
      description: faker.company.catchPhrase(),
    };
    const tenant = await tenantService.create(tenantDto);
    tenants.push(tenant);

    // Create admin user for each tenant
    const adminUserDto: CreateUserDto = {
      email: `admin${i + 1}@${tenantSlug}.com`,
      password: 'password123',
      firstName: `Admin${i + 1}`,
      lastName: `User${i + 1}`,
      role: Role.ADMIN,
      tenantId: tenant.id,
    };
    await userService.create(adminUserDto, tenant.id);

    const normalUserDto: CreateUserDto = {
      email: `user${i + 1}@${tenantSlug}.com`,
      password: 'password123',
      firstName: `Normal${i + 1}`,
      lastName: `User${i + 1}`,
      role: Role.USER,
      tenantId: tenant.id,
    };
    await userService.create(normalUserDto, tenant.id);

    // Create companies for each tenant
    const numberOfCompanies = i === 0 ? 2 : i === 1 ? 2 : 1; // 2 companies for first two tenants, 1 for the last
    const companies = [];
    for (let j = 0; j < numberOfCompanies; j++) {
      const companyDto: CreateCompanyDto = {
        businessName: `${tenant.slug}-company-${j + 1}`,
        tradeName: `${tenant.slug}-trade-${j + 1}`,
        businessType: BusinessType.LLC,
        vatNumber: `VAT${i}${j}`,
        fiscalNumber: `FISCAL${i}${j}`,
        businessNumber: `BUS${i}${j}`,
        uniqueIdentificationNumber: `UIN${i}${j}`,
        registrationDate: new Date(),
        address: `${j + 1} Main St`,
        municipality: 'Test City',
        phoneNumber: `+1234567890${j}`,
        email: `company${j + 1}@${tenant.slug}.com`,
        bankAccount: `BANK${i}${j}`,
        tenantId: tenant.id,
      };
      const company = await companyService.create(companyDto, tenant.id);
      companies.push(company);

      // Create articles for each company
      const articles = [];
      for (let k = 0; k < 3; k++) {
        const articleDto = {
          name: `${tenant.slug}-article-${j + 1}-${k + 1}`,
          description: `Description for article ${k + 1}`,
          basePrice: 100 + k,
          vatRate: 18,
          unit: 'piece',
          code: `${tenant.slug}-${j + 1}-${k + 1}`,
          companyId: company.id,
        };
        const article = await articleService.create(articleDto, tenant.id);
        articles.push(article);
      }

      // Create invoices between companies
      for (let k = 0; k < companies.length; k++) {
        if (k !== j) {
          const invoiceDto = {
            issuerId: company.id,
            recipientId: companies[k].id,
            items: [
              {
                articleId: articles[0].id,
                quantity: 2,
                unitPrice: 100,
              },
            ],
            issueDate: new Date(),
          };
          
          await invoiceService.createInvoice(invoiceDto, tenant.id);
        }
      }
    }
  }

  console.log('Seeding completed successfully!');
  await app.close();
}

bootstrap(); 