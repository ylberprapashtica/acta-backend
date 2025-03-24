import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Article } from './article.entity';
import { Invoice } from './invoice.entity';

@Entity()
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  invoice: Invoice;

  @ManyToOne(() => Article, (article) => article.invoiceItems, { onDelete: 'SET NULL' })
  article: Article;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, comment: 'If not set, defaults to article.basePrice' })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  vatAmount: number;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotals() {
    if (this.quantity && this.unitPrice) {
      this.totalPrice = this.quantity * this.unitPrice;
      // Assuming 20% VAT rate - this should be configurable in a real application
      this.vatAmount = this.totalPrice * 0.2;
    }
  }
} 