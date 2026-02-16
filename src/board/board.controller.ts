import {
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { FillCellDto } from '../dto/fill-cell.dto';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get(':id')
  @Header('Cache-Control', 'no-cache')
  @Header('Content-Type', 'application/json')
  async getBoard(@Param('id') boardIx: number) {
    return this.boardService.getBoard(boardIx).then((board) => {
      console.log(`Current board - ${boardIx}: ${JSON.stringify(board)}`);
      return board;
    });
  }

  @Post(':id')
  @HttpCode(201)
  async fill(@Param('id') boardIx: number, @Body() fillCell: FillCellDto) {
    console.log(`fill cell ${JSON.stringify(fillCell)}`);
    return this.boardService
      .fill(boardIx, fillCell.blockIx, fillCell.cellIx, fillCell.value)
      .then(
        () => {
          return { message: 'cell value accepted' };
        },
        () => {
          throw new ConflictException('incorrect cell value');
        },
      );
  }
}
