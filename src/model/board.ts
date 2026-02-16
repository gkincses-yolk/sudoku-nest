import { Block } from './block';

export class Board {
  constructor(
    readonly ix: number,
    readonly blocks: Block[],
  ) {}
}
