import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TenantService } from '../../tenant/tenant.service';
import { UserService } from '../../user/user.service';
import { CompanyService } from '../../company/company.service';
import { ArticleService } from '../../article/article.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { CreateTenantDto } from '../../tenant/dto/create-tenant.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { VatCode } from '../../article/article.entity';
import { BusinessType } from '../../company/company.entity';
import { Role } from '../../user/user.entity';
import { faker } from '@faker-js/faker';
import { CreateCompanyDto } from '../../company/dto/create-company.dto';
import { CreateArticleDto } from '../../article/dto/create-article.dto';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

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
    const tenantDto: CreateTenantDto = {
      name: faker.company.name(),
      slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
      description: faker.company.catchPhrase(),
    };
    const tenant = await tenantService.create(tenantDto);
    tenants.push(tenant);

    // Create admin and normal user for each tenant
    const adminUserDto: CreateUserDto = {
      email: `admin${i + 1}@${tenant.slug}.com`,
      password: 'password123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: Role.ADMIN,
      tenantId: tenant.id,
    };
    await userService.create(adminUserDto);

    const normalUserDto: CreateUserDto = {
      email: `user${i + 1}@${tenant.slug}.com`,
      password: 'password123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: Role.USER,
      tenantId: tenant.id,
    };
    await userService.create(normalUserDto);

    // Create companies for each tenant
    const numberOfCompanies = i === 0 ? 2 : i === 1 ? 2 : 1; // 2 companies for first two tenants, 1 for the last
    const companies = [];
    
    for (let j = 0; j < numberOfCompanies; j++) {
      const companyDto: CreateCompanyDto = {
        businessName: faker.company.name(),
        tradeName: faker.company.name(),
        businessType: faker.helpers.arrayElement(Object.values(BusinessType)),
        uniqueIdentificationNumber: faker.string.numeric(10),
        businessNumber: faker.string.numeric(8),
        fiscalNumber: faker.string.numeric(8),
        vatNumber: faker.string.numeric(8),
        registrationDate: faker.date.past(),
        municipality: faker.address.city(),
        address: faker.address.streetAddress(),
        phoneNumber: faker.phone.number(),
        email: faker.internet.email(),
        bankAccount: faker.finance.accountNumber(),
        tenantId: tenant.id,
      };
      const company = await companyService.create(companyDto, tenant.id);
      companies.push(company);

      // Create 5 articles for each company
      const articles = [];
      for (let k = 0; k < 5; k++) {
        const articleDto: CreateArticleDto = {
          name: faker.commerce.productName(),
          unit: faker.helpers.arrayElement(['piece', 'kg', 'liter', 'meter']),
          code: faker.string.alphanumeric(6).toUpperCase(),
          vatCode: faker.helpers.arrayElement([VatCode.ZERO, VatCode.EIGHT, VatCode.EIGHTEEN]),
          basePrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
          companyId: company.id,
        };
        const article = await articleService.create(articleDto);
        articles.push(article);
      }

      // Create 5 invoices for each company
      const tenantCompanies = companies.filter(c => c.tenantId === tenant.id);
      for (let k = 0; k < 5 && tenantCompanies.length > 1; k++) {
        const recipientCompany = faker.helpers.arrayElement(tenantCompanies.filter(c => c.id !== company.id));
        const numberOfItems = faker.number.int({ min: 1, max: 3 });
        const selectedArticles = faker.helpers.arrayElements(articles, numberOfItems);
        const issueDate = faker.date.recent();
        
        const invoiceDto: CreateInvoiceDto = {
          invoiceNumber: `INV-${faker.string.numeric(6)}`,
          issueDate: issueDate,
          dueDate: new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from issue date
          issuerId: company.id,
          recipientId: recipientCompany.id,
          items: selectedArticles.map(article => ({
            articleId: article.id,
            quantity: faker.number.float({ min: 1, max: 10 }),
            unitPrice: article.basePrice,
          })),
        };
        
        await invoiceService.createInvoice(invoiceDto);
      }
    }
  }

  console.log('Seeding completed successfully!');
  await app.close();
}

bootstrap(); 