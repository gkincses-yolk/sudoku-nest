import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { ReadStream } from 'fs';
import { Buffer } from 'node:buffer';
import { Cell } from '../model/cell';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../model/board';
import { Block } from '../model/block';
import { OrmCell } from '../orm/model/cell';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(OrmCell)
    private readonly repository: Repository<OrmCell>,
  ) {}

  private readonly _emptyCell = new Cell(0, '', true);
  private readonly _emptyBlock = new Block(
    0,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Array(9).fill(this._emptyCell),
  );

  async getBoard() {
    return await this.repository
      .find({
        order: {
          blockIx: 'ASC',
          cellIx: 'ASC',
        },
      })
      .then(async (ormCells) => {
        console.log(`ormCells = ${JSON.stringify(ormCells, null, 2)}`);
        if (ormCells.length !== 0) {
          return this.buildBoard(ormCells);
        }
        const board = await this.getInitialBoard().then((string: string) => {
          console.log(`Fetched initial json: ${string}`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const jsonData = JSON.parse(string);
          let blockIx = 0;
          const board = new Board(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
            jsonData.blocks?.map((blockData: any) => {
              // console.log(`Block data: ${JSON.stringify(blockData)}`);
              if (
                blockData &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                blockData.cells &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                Array.isArray(blockData.cells)
              ) {
                let cellIx = 0;
                return new Block(
                  blockIx++,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
                  blockData.cells.map((cellData: any) => {
                    cellIx++;
                    // console.log(`Cell data: ${JSON.stringify(cellData)}`);
                    if (cellData) {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      if (cellData.value) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                        return new Cell(cellIx - 1, cellData.value, true);
                      } else {
                        return new Cell(cellIx - 1, ' ', true);
                      }
                    } else {
                      console.log(
                        `Szar van a palacsintában ${blockIx}:${cellIx}`,
                      );
                      return this._emptyCell;
                    }
                  }),
                );
              } else {
                console.warn(
                  `Invalid block data: ${JSON.stringify(blockData)}`,
                );
                return this._emptyBlock;
              }
            }),
          );
          this.saveInitialBoard(board);
          return board;
        });
        console.log(`Initial board: ${JSON.stringify(board)}`);
        return board;
      });
  }

  buildBoard(ormCells: OrmCell[]): Board {
    let cells: Cell[] = [];
    const blocks: Block[] = [];
    let lastBlockIx: number = -1;
    ormCells.forEach((ormCell) => {
      if (lastBlockIx !== ormCell.blockIx) {
        if (lastBlockIx !== -1) {
          blocks.push(new Block(lastBlockIx, cells));
          cells = [];
        }
        lastBlockIx = ormCell.blockIx;
      }
      cells.push(new Cell(ormCell.cellIx, ormCell.value, ormCell.orig));
    });
    blocks.push(new Block(lastBlockIx, cells));
    const board = new Board(blocks);
    console.log(`built board: ${JSON.stringify(board)}`);
    return board;
  }

  saveInitialBoard(board: Board) {
    board.blocks.forEach((block) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      block.cells.forEach(async (cell) => {
        return await this.repository.save(
          new OrmCell(block.ix, cell.ix, cell.value),
        );
      });
    });
  }

  async getInitialBoard() {
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

  async fill(blockIx: number, cellIx: number, value: number) {
    await this.repository
      .findOneBy({ blockIx, cellIx })
      .then(async (ormCell) => {
        if (!ormCell) {
          console.error(`No cell found for ${blockIx + 1}:${cellIx + 1}`);
          return false;
        }
        ormCell.setValue(value.toString());
        await this.repository.save(ormCell);
        return true;
      });
  }
}
