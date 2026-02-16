import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('cell')
export class OrmCell {
  constructor(blockIx: number, cellIx: number, value: string) {
    this.blockIx = blockIx;
    this.cellIx = cellIx;
    this.setValue(value);
    this.orig = true;
  }

  @PrimaryColumn('int4')
  blockIx: number;

  @PrimaryColumn('int4')
  cellIx: number;

  @Column('text', { nullable: false })
  value: string;

  @Column('boolean', { nullable: false })
  orig: boolean;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  setValue(value: string) {
    this.value = value;
    this.orig = false;
    this.updatedAt = new Date();
  }
}
