import { Module } from '@nestjs/common';
import { BoardController } from './board/board.controller';
import { BoardService } from './board/board.service';

@Module({
  imports: [],
  controllers: [BoardController],
  providers: [BoardService],
})
export class AppModule {}
