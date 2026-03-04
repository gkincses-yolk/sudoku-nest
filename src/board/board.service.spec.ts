import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrmBoard } from '../orm/model/board';
import { Repository } from 'typeorm';
import { OrmBlock } from '../orm/model/block';
import { OrmCell } from '../orm/model/cell';
import { Board } from '../model/board';
import { Block } from '../model/block';
import { Cell } from '../model/cell';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: getRepositoryToken(OrmBoard),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrmBlock),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrmCell),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('all empties should validate', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(service.validate9(Array(9).fill(''))).toBe(true);
  });

  it('all different numbers should validate', () => {
    expect(
      service.validate9(['1', '2', '3', '4', '5', '6', '7', '8', '9']),
    ).toBe(true);
  });

  it('all different numbers or empties should validate', () => {
    expect(service.validate9(['1', '2', '', '4', '5', '', '7', '', '9'])).toBe(
      true,
    );
  });

  it('any duplicate number should not validate', () => {
    expect(service.validate9(['1', '1', '', '', '5', '6', '7', '8', '9'])).toBe(
      false,
    );
  });

  it('any duplicate number at the end should not validate', () => {
    expect(service.validate9(['1', '2', '3', '', '5', '', '7', '8', '8'])).toBe(
      false,
    );
  });

  it('any duplicate number even in a short list should not validate', () => {
    expect(service.validate9(['1', '1'])).toBe(false);
  });

  const defaultCells: Cell[] = [
    new Cell(0, '1'),
    new Cell(1, '2'),
    new Cell(2, '3'),
    new Cell(3, '4'),
    new Cell(4, '5'),
    new Cell(5, '6'),
    new Cell(6, '7'),
    new Cell(7, '8'),
    new Cell(8, '9'),
  ];

  const defaultBoard: Board = new Board(0, [
    new Block(0, defaultCells),
    new Block(1, defaultCells),
    new Block(2, defaultCells),
    new Block(3, defaultCells),
    new Block(4, defaultCells),
    new Block(5, defaultCells),
    new Block(6, defaultCells),
    new Block(7, defaultCells),
    new Block(8, defaultCells),
  ]);

  it('adjacent blocks are calculated correctly - top row', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksAcross(
      defaultBoard,
      1,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(0);
    expect(adjacentBlocksAcross[1].ix).toBe(1);
    expect(adjacentBlocksAcross[2].ix).toBe(2);
  });

  it('adjacent blocks are calculated correctly - middle row', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksAcross(
      defaultBoard,
      5,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(3);
    expect(adjacentBlocksAcross[1].ix).toBe(4);
    expect(adjacentBlocksAcross[2].ix).toBe(5);
  });

  it('adjacent blocks are calculated correctly - bottom row', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksAcross(
      defaultBoard,
      7,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(6);
    expect(adjacentBlocksAcross[1].ix).toBe(7);
    expect(adjacentBlocksAcross[2].ix).toBe(8);
  });

  it('adjacent blocks are calculated correctly - left column', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksDown(
      defaultBoard,
      3,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(0);
    expect(adjacentBlocksAcross[1].ix).toBe(3);
    expect(adjacentBlocksAcross[2].ix).toBe(6);
  });

  it('adjacent blocks are calculated correctly - middle column', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksDown(
      defaultBoard,
      1,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(1);
    expect(adjacentBlocksAcross[1].ix).toBe(4);
    expect(adjacentBlocksAcross[2].ix).toBe(7);
  });

  it('adjacent blocks are calculated correctly - left column', () => {
    const adjacentBlocksAcross: Block[] = service.calcBlocksDown(
      defaultBoard,
      8,
    );
    expect(adjacentBlocksAcross.length).toBe(3);
    expect(adjacentBlocksAcross[0].ix).toBe(2);
    expect(adjacentBlocksAcross[1].ix).toBe(5);
    expect(adjacentBlocksAcross[2].ix).toBe(8);
  });
});
