import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrmBlock } from './block';

@Entity('cell')
export class OrmCell {
  constructor(block: OrmBlock, cellIx: number, value: string) {
    this.ormBlock = block;
    this.cellIx = cellIx;
    this.setValue(value);
    this.orig = true;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column('int4', { nullable: false })
  cellIx: number;

  @Column('text', { nullable: false })
  value: string;

  @Column('boolean', { nullable: false })
  orig: boolean;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  @ManyToOne(() => OrmBlock, (block) => block.ormCells)
  ormBlock: OrmBlock;

  setValue(value: string) {
    this.value = value;
    this.orig = false;
    this.updatedAt = new Date();
  }
}
