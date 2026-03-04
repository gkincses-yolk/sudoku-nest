import { Injectable } from '@nestjs/common';
import { createReadStream, ReadStream } from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { Cell } from '../model/cell';
import { Repository } from 'typeorm';
import { Board } from '../model/board';
import { Block } from '../model/block';
import { OrmCell } from '../orm/model/cell';
import { OrmBlock } from '../orm/model/block';
import { OrmBoard } from '../orm/model/board';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(OrmBoard)
    private readonly boardRepo: Repository<OrmBoard>,
    @InjectRepository(OrmBlock)
    private readonly blockRepo: Repository<OrmBlock>,
    @InjectRepository(OrmCell)
    private readonly cellRepo: Repository<OrmCell>,
  ) {}

  private readonly _emptyCell = new Cell(0, '', true);
  private readonly _emptyBlock = new Block(
    0,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    new Array(9).fill(this._emptyCell),
  );

  buildBoard(boardIx: number, ormBlocks: OrmBlock[]): Board {
    const blocks: Block[] = [];
    ormBlocks.forEach((ormBlock) => {
      let cells: Cell[] = [];
      ormBlock.ormCells.forEach((ormCell) => {
        cells.push(new Cell(ormCell.cellIx, ormCell.value, ormCell.orig));
      });
      blocks.push(new Block(ormBlock.blockIx, cells));
      cells = [];
    });
    const board = new Board(boardIx, blocks);
    console.log(`built board: ${JSON.stringify(board)}`);
    return board;
  }

  async getBoard(boardIx: number) {
    return await this.blockRepo
      .find({
        order: {
          blockIx: 'ASC',
        },
      })
      .then(async (ormBlocks) => {
        if (ormBlocks.length !== 0) {
          return this.buildBoard(boardIx, ormBlocks);
        }
        const board = await this.readInitialBoard().then(
          async (string: string) => {
            console.log(`Fetched initial json: ${string}`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const boardData: Board = JSON.parse(string);
            console.log(
              `Fetched initial block[]: ${JSON.stringify(boardData.blocks)}`,
            );
            let blockIx = 0;
            const board = new Board(
              boardIx,
              boardData.blocks?.map((blockData: Block) => {
                console.log(
                  `blockData ${blockIx}\n${JSON.stringify(blockData)}`,
                );
                if (!blockData?.cells || !Array.isArray(blockData.cells)) {
                  console.warn(
                    `Invalid block data: ${JSON.stringify(blockData)}`,
                  );
                  return this._emptyBlock;
                }
                let cellIx = 0;
                blockIx++;
                return new Block(
                  blockIx - 1,
                  blockData.cells.map((cellData: Cell) => {
                    cellIx++;
                    if (!cellData) {
                      console.log(
                        `Szar van a palacsintában ${blockIx}:${cellIx}`,
                      );
                      return this._emptyCell;
                    }
                    return new Cell(cellIx - 1, cellData['value'] ?? ' ', true);
                  }),
                );
              }),
            );
            await this.saveInitialBoard(board);
            return board;
          },
        );
        console.log(`Initial board: ${JSON.stringify(board)}`);
        return board;
      });
  }

  async saveInitialBoard(board: Board) {
    await this.boardRepo.save(new OrmBoard(board.ix)).then((ormBoard) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      board.blocks.forEach(async (block) => {
        const ormBlock = await this.blockRepo
          .save(new OrmBlock(ormBoard, block.ix))
          .then((ormBlock) => {
            return ormBlock;
          });
        for (const cell of block.cells) {
          await this.cellRepo
            .save(new OrmCell(ormBlock, cell['ix'], cell.getValue()))
            .then((ormCell) => {
              return ormCell;
            });
        }
      });
    });
  }

  async readInitialBoard() {
    const testFileAsReadableStream = createReadStream(
      path.join(process.cwd(), '/board.init.json'),
    );

    const streamToString = async (stream: ReadStream) => {
      const chunks = [];
      for await (const chunk of stream) {
        // @ts-expect-error dunno
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString('utf-8');
    };

    return await streamToString(testFileAsReadableStream);
  }

  async fill(boardIx: number, blockIx: number, cellIx: number, value: number) {
    return await this.boardRepo.findOne({ where: { boardIx: boardIx } }).then(
      async (ormBoard) => {
        if (!ormBoard?.ormBlocks?.[blockIx].ormCells) {
          console.error(`No cell found for ${blockIx}:${cellIx}`);
          return false;
        }
        console.log(`before ${JSON.stringify(ormBoard)}`);
        const ormCell = ormBoard.ormBlocks[blockIx].ormCells[cellIx];
        console.log(`before ${JSON.stringify(ormCell)}`);
        const board: Board = this.buildBoard(
          ormBoard?.boardIx,
          ormBoard?.ormBlocks,
        );
        if (!this.validateNewValue(board, blockIx, cellIx, value)) {
          return false;
        }
        ormCell.setValue(value.toString());
        console.log(`after ${JSON.stringify(ormCell)}`);
        await this.cellRepo.save(ormCell).then(() => {
          return true;
        });
        return true;
      },
      (reason) => {
        console.log(`ouch ${JSON.stringify(reason)}`);
        return false;
      },
    );
  }

  validateNewValue(
    board: Board,
    blockIx: number,
    cellIx: number,
    value: number,
  ): boolean {
    console.log(`new value at: ${blockIx}:${cellIx} set to ${value}`);

    board = this.setValue(board, blockIx, cellIx, value);

    return (
      this.validate9(
        this.calcRow(board, blockIx, cellIx).map((c) => c.getValue()),
      ) &&
      this.validate9(
        this.calcColumn(board, blockIx, cellIx).map((c) => c.getValue()),
      ) &&
      this.validate9(board.blocks[blockIx].cells.map((c) => c.getValue()))
    );
  }

  setValue(
    board: Board,
    blockIx: number,
    cellIx: number,
    value: number,
  ): Board {
    board.blocks[blockIx].cells[cellIx].setValue(value.toString());
    return board;
  }

  calcRow(board: Board, blockIx: number, cellIx: number): Cell[] {
    return this.buildLine(
      this.calcBlocksAcross(board, blockIx),
      this.calcRowIndexes(cellIx),
    );
  }

  calcColumn(board: Board, blockIx: number, cellIx: number): Cell[] {
    return this.buildLine(
      this.calcBlocksDown(board, blockIx),
      this.calcColumnIndexes(cellIx),
    );
  }

  private buildLine(adjacentBlocks: Block[], inlineCellIndexes: number[]) {
    const cells: Cell[] = [];
    for (let ix = 0; ix < 3; ix++) {
      for (let iy = 0; iy < 3; iy++) {
        cells.push(adjacentBlocks[ix].cells[inlineCellIndexes[iy]]);
      }
    }
    console.log(`line=${JSON.stringify(cells)}`);
    return cells;
  }

  calcBlocksAcross(board: Board, blockIx: number): Block[] {
    if (blockIx === 0 || blockIx === 1 || blockIx === 2) {
      return board.blocks.slice(0, 3);
    }
    if (blockIx === 3 || blockIx === 4 || blockIx === 5) {
      return board.blocks.slice(3, 6);
    }
    if (blockIx === 6 || blockIx === 7 || blockIx === 8) {
      return board.blocks.slice(6, 9);
    }
    return [];
  }

  calcBlocksDown(board: Board, blockIx: number): Block[] {
    if (blockIx === 0 || blockIx === 3 || blockIx === 6) {
      return [board.blocks[0], board.blocks[3], board.blocks[6]];
    }
    if (blockIx === 1 || blockIx === 4 || blockIx === 7) {
      return [board.blocks[1], board.blocks[4], board.blocks[7]];
    }
    if (blockIx === 2 || blockIx === 5 || blockIx === 8) {
      return [board.blocks[2], board.blocks[5], board.blocks[8]];
    }
    return [];
  }

  calcRowIndexes(cellIx: number): number[] {
    if (cellIx === 0 || cellIx === 1 || cellIx === 2) {
      return [0, 1, 2];
    }
    if (cellIx === 3 || cellIx === 4 || cellIx === 5) {
      return [3, 4, 5];
    }
    if (cellIx === 6 || cellIx === 7 || cellIx === 8) {
      return [6, 7, 8];
    }
    return [];
  }

  calcColumnIndexes(cellIx: number): number[] {
    if (cellIx === 0 || cellIx === 3 || cellIx === 6) {
      return [0, 3, 6];
    }
    if (cellIx === 1 || cellIx === 4 || cellIx === 7) {
      return [1, 4, 7];
    }
    if (cellIx === 2 || cellIx === 5 || cellIx === 8) {
      return [2, 5, 8];
    }
    return [];
  }

  validate9(values: string[]): boolean {
    console.log(`validating: ${JSON.stringify(values)}`);
    const seen: number[] = [];
    return values
      .map((valueString: string) =>
        valueString === ' ' ? 0 : Number.parseInt(valueString),
      )
      .every((value) => {
        console.log(`value=${value}`);
        if (value === 0) {
          console.log('success: value is 0 aka empty');
          return true;
        }
        if (seen.includes(value)) {
          console.log(`fail: duplicate value ${value}`);
          return false;
        }
        seen.push(value);
        console.log(`success: new value ${value}`);
        return true;
      });
  }
}
