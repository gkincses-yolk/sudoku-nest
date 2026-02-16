import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { OrmCell } from '../model/cell';

export default registerAs(
  'orm.config',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'gkincses',
    password: '',
    database: 'sudoku',
    entities: [OrmCell],
    synchronize: true, // Disable this always in production
  }),
);
