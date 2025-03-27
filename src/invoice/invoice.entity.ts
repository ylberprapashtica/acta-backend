import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Company } from '../company/company.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @ManyToOne(() => Company, (company: Company) => company.issuedInvoices)
  issuer: Company;

  @ManyToOne(() => Company, (company: Company) => company.receivedInvoices)
  recipient: Company;

  @OneToMany(() => InvoiceItem, (invoiceItem: InvoiceItem) => invoiceItem.invoice, { cascade: true })
  items: InvoiceItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalVat: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotals() {
    if (this.items) {
      this.totalAmount = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      this.totalVat = this.items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
    }
  }
} 