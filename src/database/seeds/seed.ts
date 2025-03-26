import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CompanyService } from '../../company/company.service';
import { ArticleService } from '../../article/article.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { faker } from '@faker-js/faker';
import { CreateCompanyDto } from '../../company/dto/create-company.dto';
import { CreateArticleDto } from '../../article/dto/create-article.dto';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';
import { VatCode } from '../../entities/article.entity';
import { BusinessType } from '../../company/entities/company.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const companyService = app.get(CompanyService);
  const articleService = app.get(ArticleService);
  const invoiceService = app.get(InvoiceService);

  // Create 5 companies
  const companies = [];
  for (let i = 0; i < 5; i++) {
    const companyDto: CreateCompanyDto = {
      businessName: faker.company.name(),
      tradeName: faker.company.name(),
      businessType: faker.helpers.arrayElement(Object.values(BusinessType)),
      uniqueIdentificationNumber: faker.string.numeric(10),
      businessNumber: faker.string.numeric(8),
      fiscalNumber: faker.string.numeric(8),
      vatNumber: faker.string.numeric(8),
      registrationDate: faker.date.past(),
      municipality: faker.location.city(),
      address: faker.location.streetAddress(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      bankAccount: faker.finance.accountNumber(),
    };
    const company = await companyService.create(companyDto);
    companies.push(company);
  }

  // Create 5 articles for each company
  const articles = [];
  for (const company of companies) {
    for (let i = 0; i < 5; i++) {
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
  }

  // Create 5 invoices for each company
  for (const company of companies) {
    const companyArticles = articles.filter(article => article.companyId === company.id);
    
    for (let i = 0; i < 5; i++) {
      const recipientCompany = faker.helpers.arrayElement(companies.filter(c => c.id !== company.id));
      const numberOfItems = faker.number.int({ min: 1, max: 3 });
      const selectedArticles = faker.helpers.arrayElements(companyArticles, numberOfItems);
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

  console.log('Seeding completed successfully!');
  await app.close();
}

bootstrap(); 