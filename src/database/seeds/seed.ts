import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CompanyService } from '../../company/company.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Article } from '../../entities/article.entity';
import { Invoice } from '../../entities/invoice.entity';
import { InvoiceService } from '../../invoice/invoice.service';
import { BusinessType } from '../../company/entities/company.entity';
import { VatCode } from '../../entities/article.entity';
import { faker } from '@faker-js/faker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const companyRepository = app.get<Repository<Company>>(getRepositoryToken(Company));
  const articleRepository = app.get<Repository<Article>>(getRepositoryToken(Article));
  const invoiceService = app.get<InvoiceService>(InvoiceService);

  // Clear existing data
  await invoiceService['invoiceRepository'].delete({});
  await articleRepository.delete({});
  await companyRepository.delete({});

  console.log('Starting seed process...');

  // Create 10 companies
  const companies: Company[] = [];
  for (let i = 0; i < 10; i++) {
    const company = companyRepository.create({
      businessName: faker.company.name(),
      tradeName: faker.company.name(),
      businessType: faker.helpers.arrayElement(Object.values(BusinessType)),
      uniqueIdentificationNumber: faker.string.alphanumeric(10).toUpperCase(),
      businessNumber: faker.string.numeric(8),
      fiscalNumber: faker.string.numeric(9),
      vatNumber: faker.string.numeric(11),
      registrationDate: faker.date.past(),
      municipality: faker.location.city(),
      address: faker.location.streetAddress(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      bankAccount: faker.finance.accountNumber(),
    });
    companies.push(await companyRepository.save(company));
    console.log(`Created company ${i + 1}/10`);
  }

  // Create 100 articles for each company
  const articlesMap = new Map<string, Article[]>();
  for (const company of companies) {
    const articles: Article[] = [];
    for (let i = 0; i < 100; i++) {
      const article = articleRepository.create({
        name: faker.commerce.productName(),
        unit: faker.helpers.arrayElement(['piece', 'kg', 'liter', 'meter', 'hour']),
        code: faker.string.alphanumeric(6).toUpperCase(),
        vatCode: faker.helpers.arrayElement([VatCode.ZERO, VatCode.EIGHT, VatCode.EIGHTEEN]),
        basePrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      });
      articles.push(await articleRepository.save(article));
    }
    articlesMap.set(company.id, articles);
    console.log(`Created 100 articles for company ${company.businessName}`);
  }

  // Create 100 invoices for each company
  for (const issuer of companies) {
    const issuerArticles = articlesMap.get(issuer.id) || [];
    
    for (let i = 0; i < 100; i++) {
      // Select a random recipient (different from issuer)
      const recipient = faker.helpers.arrayElement(
        companies.filter(c => c.id !== issuer.id)
      );

      // Generate 1-10 random items for the invoice
      const itemCount = faker.number.int({ min: 1, max: 10 });
      const items = Array.from({ length: itemCount }, () => {
        const article = faker.helpers.arrayElement(issuerArticles);
        return {
          articleId: article.id,
          quantity: faker.number.int({ min: 1, max: 10 }),
          unitPrice: parseFloat(faker.commerce.price({ min: article.basePrice, max: article.basePrice * 1.5 })),
        };
      });

      await invoiceService.createInvoice({
        issuerId: issuer.id,
        recipientId: recipient.id,
        items,
        issueDate: faker.date.between({ 
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 
          to: new Date() 
        }),
      });
    }
    console.log(`Created 100 invoices for company ${issuer.businessName}`);
  }

  console.log('Seed completed successfully!');
  await app.close();
}

bootstrap().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
}); 