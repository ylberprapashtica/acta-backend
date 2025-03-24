import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

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

  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.article)
  invoiceItems: InvoiceItem[];
} 