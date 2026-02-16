import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrmBlock } from './block';

@Entity('board')
export class OrmBoard {
  constructor(boardIx: number) {
    this.boardIx = boardIx;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column('int4')
  boardIx: number;

  private _ormBlocks: OrmBlock[];

  @OneToMany(() => OrmBlock, (block) => block.ormBoard, {
    cascade: true,
    eager: true,
  })
  get ormBlocks(): OrmBlock[] {
    return this._ormBlocks;
  }
  set ormBlocks(ormBlocks: OrmBlock[]) {
    ormBlocks.sort((a, b) => a.blockIx - b.blockIx);
    this._ormBlocks = ormBlocks;
  }
}
