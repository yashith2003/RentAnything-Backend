
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [],
  synchronize: false, 
});

async function check() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    const categories = await queryRunner.query('SELECT * FROM categories');
    console.log('Total categories:', categories.length);
    console.log('Categories:', JSON.stringify(categories, null, 2));

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
