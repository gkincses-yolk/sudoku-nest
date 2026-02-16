import {
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  Post,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { FillCellDto } from '../dto/fill-cell.dto';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @Header('Cache-Control', 'no-cache') // Set header using @Header decorator
  @Header('Content-Type', 'application/json')
  async getBoard() {
    return this.boardService.getBoard().then((board) => {
      console.log(`Current board: ${JSON.stringify(board)}`);
      return board;
    });
  }

  @Post()
  async fill(@Body() fillCell: FillCellDto) {
    console.log(`fill cell ${JSON.stringify(fillCell)}`);
    return this.boardService
      .fill(fillCell.blockIx, fillCell.cellIx, fillCell.value)
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
