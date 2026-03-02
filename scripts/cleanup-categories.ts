
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

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    const mapping = [
      { canonical: 'Vehicle', others: ['Vehicles'] },
      { canonical: 'Electronics', others: ['Electronic'] },
      { canonical: 'Home', others: ['Home & Garden'] },
      { canonical: 'Fashion', others: ['Clothing'] },
      { canonical: 'Sport', others: ['Sports'] },
    ];

    for (const item of mapping) {
      console.log(`Processing ${item.canonical}...`);
      
      // Get canonical ID
      const canonicalRes = await queryRunner.query('SELECT id FROM categories WHERE name = $1', [item.canonical]);
      if (canonicalRes.length === 0) {
        console.log(`Canonical category ${item.canonical} not found. Skipping.`);
        continue;
      }
      const canonicalId = canonicalRes[0].id;

      // Find other IDs
      const otherIdsRes = await queryRunner.query('SELECT id FROM categories WHERE name = ANY($1)', [item.others]);
      const otherIds = otherIdsRes.map((r: any) => r.id);

      if (otherIds.length > 0) {
        console.log(`Merging ${otherIds.join(', ')} into ${canonicalId} (${item.canonical})`);

        // 1. Update items
        await queryRunner.query('UPDATE items SET category_id = $1 WHERE category_id = ANY($2)', [canonicalId, otherIds]);
        
        // 2. Update subcategories (parent_category_id)
        await queryRunner.query('UPDATE categories SET parent_category_id = $1 WHERE parent_category_id = ANY($2)', [canonicalId, otherIds]);
        
        // 3. Update filter_configs
        // Warning: might have conflicts if same key exists in both. But let's merge for now.
        await queryRunner.query('UPDATE filter_configs SET category_id = $1 WHERE category_id = ANY($2)', [canonicalId, otherIds]);

        // 4. Delete old categories
        await queryRunner.query('DELETE FROM categories WHERE id = ANY($1)', [otherIds]);
        
        console.log(`Successfully merged ${item.canonical}.`);
      } else {
        console.log(`No duplicates found for ${item.canonical}.`);
      }
    }

    // Special case: Electric Cars duplicates (2, 4, 5)
    // Let's merge 4 and 5 into 2. And make 2 a subcategory of Vehicle (1).
    console.log('Cleaning up Electric Cars...');
    const electricCarsMain = 2;
    const electricCarsOthers = [4, 5];
    
    const ecMainExists = await queryRunner.query('SELECT id FROM categories WHERE id = $1', [electricCarsMain]);
    if (ecMainExists.length > 0) {
        await queryRunner.query('UPDATE items SET category_id = $1 WHERE category_id = ANY($2)', [electricCarsMain, electricCarsOthers]);
        await queryRunner.query('UPDATE categories SET parent_category_id = $1 WHERE parent_category_id = ANY($2)', [electricCarsMain, electricCarsOthers]);
        await queryRunner.query('UPDATE filter_configs SET category_id = $1 WHERE category_id = ANY($2)', [electricCarsMain, electricCarsOthers]);
        await queryRunner.query('DELETE FROM categories WHERE id = ANY($1)', [electricCarsOthers]);
        
        // Ensure Main belongs to Vehicle (1)
        await queryRunner.query('UPDATE categories SET parent_category_id = 1 WHERE id = 2');
        console.log('Unified Electric Cars.');
    }

    console.log('Cleanup complete.');
    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

run();
