import { Module } from '@nestjs/common';
import { BoardController } from './board/board.controller';
import { BoardService } from './board/board.service';
import { ConfigModule } from '@nestjs/config';
import ormConfig from './orm/config/orm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmCell } from './orm/model/cell';
import { OrmBlock } from './orm/model/block';
import { OrmBoard } from './orm/model/board';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: ormConfig,
    }),
    TypeOrmModule.forFeature([OrmCell, OrmBlock, OrmBoard]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class AppModule {}
