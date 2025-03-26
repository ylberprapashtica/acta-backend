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

interface SeedOptions {
  numberOfCompanies: number;
  articlesPerCompany: number;
  invoicesPerCompany: number;
  itemsPerInvoice: {
    min: number;
    max: number;
  };
}

const defaultOptions: SeedOptions = {
  numberOfCompanies: 5,
  articlesPerCompany: 5,
  invoicesPerCompany: 5,
  itemsPerInvoice: {
    min: 1,
    max: 3,
  },
};

async function bootstrap(options: SeedOptions = defaultOptions) {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const companyRepository = app.get<Repository<Company>>(getRepositoryToken(Company));
  const articleRepository = app.get<Repository<Article>>(getRepositoryToken(Article));
  const invoiceService = app.get<InvoiceService>(InvoiceService);

  // Clear existing data
  await invoiceService['invoiceRepository'].delete({});
  await articleRepository.delete({});
  await companyRepository.delete({});

  console.log('Starting seed process with options:', options);

  // Create companies
  const companies: Company[] = [];
  for (let i = 0; i < options.numberOfCompanies; i++) {
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
    const savedCompany = await companyRepository.save(company);
    companies.push(savedCompany);
    console.log(`Created company ${i + 1}/${options.numberOfCompanies}: ${savedCompany.businessName}`);
  }

  // Create articles for each company
  const articlesMap = new Map<string, Article[]>();
  for (const company of companies) {
    const articles: Article[] = [];
    for (let i = 0; i < options.articlesPerCompany; i++) {
      const article = articleRepository.create({
        name: faker.commerce.productName(),
        unit: faker.helpers.arrayElement(['piece', 'kg', 'liter', 'meter', 'hour']),
        code: faker.string.alphanumeric(6).toUpperCase(),
        vatCode: faker.helpers.arrayElement([VatCode.ZERO, VatCode.EIGHT, VatCode.EIGHTEEN]),
        basePrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        companyId: company.id,
      });
      const savedArticle = await articleRepository.save(article);
      articles.push(savedArticle);
    }
    articlesMap.set(company.id, articles);
    console.log(`Created ${options.articlesPerCompany} articles for company ${company.businessName}`);
  }

  // Create invoices for each company
  for (const issuer of companies) {
    const issuerArticles = articlesMap.get(issuer.id) || [];
    
    for (let i = 0; i < options.invoicesPerCompany; i++) {
      // Select a random recipient (different from issuer)
      const recipient = faker.helpers.arrayElement(
        companies.filter(c => c.id !== issuer.id)
      );

      // Generate random items for the invoice
      const itemCount = faker.number.int({ 
        min: options.itemsPerInvoice.min, 
        max: options.itemsPerInvoice.max 
      });

      const items = [];
      for (let j = 0; j < itemCount; j++) {
        const article = faker.helpers.arrayElement(issuerArticles);
        items.push({
          articleId: article.id,
          quantity: faker.number.int({ min: 1, max: 10 }),
          unitPrice: article.basePrice,
        });
      }

      await invoiceService.createInvoice({
        issuerId: issuer.id,
        recipientId: recipient.id,
        items,
        issueDate: faker.date.past(),
      });
    }
    console.log(`Created ${options.invoicesPerCompany} invoices for company ${issuer.businessName}`);
  }

  await app.close();
  console.log('Seed completed successfully');
}

// Get command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {
  numberOfCompanies: parseInt(args[0]) || defaultOptions.numberOfCompanies,
  articlesPerCompany: parseInt(args[1]) || defaultOptions.articlesPerCompany,
  invoicesPerCompany: parseInt(args[2]) || defaultOptions.invoicesPerCompany,
  itemsPerInvoice: {
    min: parseInt(args[3]) || defaultOptions.itemsPerInvoice.min,
    max: parseInt(args[4]) || defaultOptions.itemsPerInvoice.max,
  },
};

bootstrap(options).catch(console.error); 