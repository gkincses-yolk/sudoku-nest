import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrmCell } from './cell';
import { OrmBoard } from './board';

@Entity('block')
export class OrmBlock {
  constructor(board: OrmBoard, blockIx: number) {
    this.ormBoard = board;
    this.blockIx = blockIx;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column('int4')
  blockIx: number;

  private _ormCells: OrmCell[];

  @OneToMany(() => OrmCell, (cell) => cell.ormBlock, {
    cascade: true,
    eager: true,
  })
  get ormCells(): OrmCell[] {
    return this._ormCells;
  }
  set ormCells(ormCells: OrmCell[]) {
    ormCells.sort((a, b) => a.cellIx - b.cellIx);
    this._ormCells = ormCells;
  }

  @ManyToOne(() => OrmBoard, (board) => board.ormBlocks)
  ormBoard: OrmBoard;
}
