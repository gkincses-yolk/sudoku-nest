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
import { OrmBlock } from '../orm/model/block';
import { OrmBoard } from '../orm/model/board';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(OrmBoard)
    private readonly boardRepository: Repository<OrmBoard>,
    @InjectRepository(OrmBlock)
    private readonly blockRepository: Repository<OrmBlock>,
    @InjectRepository(OrmCell)
    private readonly cellRepository: Repository<OrmCell>,
  ) {}

  private readonly _emptyCell = new Cell(0, '', true);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  private readonly _emptyBlock = new Block(0, Array(9).fill(this._emptyCell));

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
    return await this.blockRepository
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
                if (
                  !blockData ||
                  !blockData.cells ||
                  !Array.isArray(blockData.cells)
                ) {
                  console.warn(
                    `Invalid block data: ${JSON.stringify(blockData)}`,
                  );
                  return this._emptyBlock;
                }
                let cellIx = 0;
                return new Block(
                  blockIx++,
                  blockData.cells.map((cellData: Cell) => {
                    cellIx++;
                    console.log(`Cell data: ${JSON.stringify(cellData)}`);
                    if (!cellData) {
                      console.log(
                        `Szar van a palacsintában ${blockIx}:${cellIx}`,
                      );
                      return this._emptyCell;
                    }
                    return new Cell(cellIx - 1, cellData.value ?? ' ', true);
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
    await this.boardRepository.save(new OrmBoard(board.ix)).then((ormBoard) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      board.blocks.forEach(async (block) => {
        const ormBlock = await this.blockRepository
          .save(new OrmBlock(ormBoard, block.ix))
          .then((ormBlock) => {
            return ormBlock;
          });
        for (const cell of block.cells) {
          await this.cellRepository
            .save(new OrmCell(ormBlock, cell.ix, cell.value))
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
    await this.boardRepository.findOne({ where: { boardIx: boardIx } }).then(
      async (ormBoard) => {
        if (
          !ormBoard ||
          !ormBoard.ormBlocks ||
          !ormBoard.ormBlocks[blockIx].ormCells
        ) {
          console.error(`No cell found for ${blockIx}:${cellIx}`);
          return false;
        }
        console.log(`before ${JSON.stringify(ormBoard)}`);
        const ormCell = ormBoard.ormBlocks[blockIx].ormCells[cellIx];
        console.log(`before ${JSON.stringify(ormCell)}`);
        ormCell.setValue(value.toString());
        console.log(`after ${JSON.stringify(ormCell)}`);
        await this.cellRepository.save(ormCell).then(() => {
          return true;
        });
      },
      (reason) => {
        console.log(`ouch ${JSON.stringify(reason)}`);
      },
    );
  }
}
