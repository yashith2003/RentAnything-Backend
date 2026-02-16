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

async function removeDuplicateVehicle() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Find all Vehicle categories (main categories without parent)
    const vehicleCategories = await queryRunner.query(
      `SELECT id, name FROM categories WHERE name = 'Vehicle' AND parent_category_id IS NULL ORDER BY id ASC`
    );

    console.log(`Found ${vehicleCategories.length} Vehicle categories:`, vehicleCategories);

    if (vehicleCategories.length > 1) {
      // Keep the first one, delete the rest
      const keepId = vehicleCategories[0].id;
      const deleteIds = vehicleCategories.slice(1).map(cat => cat.id);

      console.log(`Keeping Vehicle category with ID: ${keepId}`);
      console.log(`Deleting duplicate Vehicle categories with IDs: ${deleteIds.join(', ')}`);

      // First, update any subcategories that point to the duplicates to point to the kept one
      for (const deleteId of deleteIds) {
        await queryRunner.query(
          `UPDATE categories SET parent_category_id = $1 WHERE parent_category_id = $2`,
          [keepId, deleteId]
        );
        console.log(`Updated subcategories from parent ${deleteId} to ${keepId}`);
      }

      // Then delete the duplicate categories
      await queryRunner.query(
        `DELETE FROM categories WHERE id = ANY($1)`,
        [deleteIds]
      );
      console.log(`Deleted ${deleteIds.length} duplicate Vehicle categories`);
    } else {
      console.log('No duplicate Vehicle categories found.');
    }

    console.log('Cleanup complete.');
    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

removeDuplicateVehicle();
