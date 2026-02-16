import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { OrmCell } from '../model/cell';
import { OrmBlock } from '../model/block';
import { OrmBoard } from '../model/board';

export default registerAs(
  'orm.config',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'gkincses',
    password: '',
    database: 'sudoku',
    entities: [OrmBoard, OrmBlock, OrmCell],
    logging: true,
    synchronize: true, // Disable this always in production
  }),
);
