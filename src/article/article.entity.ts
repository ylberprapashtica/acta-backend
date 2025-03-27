import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { InvoiceItem } from '../invoice/invoice-item.entity';
import { Company } from '../company/company.entity';

export enum VatCode {
  ZERO = 0,
  EIGHT = 8,
  EIGHTEEN = 18,
}

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: VatCode,
    default: VatCode.ZERO,
  })
  vatCode: VatCode;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @ManyToOne(() => Company, (company: Company) => company.articles, { nullable: false })
  company: Company;

  @Column('uuid', { nullable: false })
  companyId: string;

  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.article)
  invoiceItems: InvoiceItem[];
} 