import { Cell } from './cell';

export class Block {
  constructor(
    readonly ix: number,
    readonly cells: Cell[],
  ) {}
}
