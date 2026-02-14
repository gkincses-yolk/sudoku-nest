import { Controller, Get, Header } from '@nestjs/common';
import { BoardService } from './board.service';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  @Header('Cache-Control', 'no-cache') // Set header using @Header decorator
  @Header('Content-Type', 'application/json')
  getBoard() {
    return this.boardService.getBoard();
  }
}
