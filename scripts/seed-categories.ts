
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
  entities: [], // No entities needed for raw SQL
  synchronize: false, 
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Fix existing 'Vehicles' category if it exists
    console.log('Checking for legacy "Vehicles" category...');
    await queryRunner.query(
        `UPDATE categories SET name = 'Vehicle' WHERE name = 'Vehicles'`
    );

    const categories = {
        'Electronics': ['Computer', 'Phone', 'Tablet', 'Camera', 'Headphones', 'Drones', 'TV', 'Speakers'],
        'Vehicle': ['Car', 'Bike', 'Truck', 'Cycle', 'Scooter', 'Van', 'Bus', 'Boat'],
        'Home': ['Furniture', 'Decoration', 'Appliances', 'Kitchen', 'Bedding', 'Gardening', 'Lighting', 'Tools'],
        'Fashion': ['Men', 'Women', 'Kids', 'Accessories', 'Shoes', 'Bags', 'Watches', 'Jewelry'],
        'Sport': ['Gym', 'Cricket', 'Football', 'Tennis', 'Badminton', 'Camping', 'Hiking', 'Swimming']
    };

    for (const [mainCatName, subCats] of Object.entries(categories)) {
        // Check/Create Main Category
        let mainCatId;
        const mainCatRes = await queryRunner.query(
            `SELECT id FROM categories WHERE name = $1`, 
            [mainCatName]
        );

        if (mainCatRes.length === 0) {
            console.log(`Creating ${mainCatName} category...`);
            const insertRes = await queryRunner.query(
                `INSERT INTO categories (name) VALUES ($1) RETURNING id`,
                [mainCatName]
            );
            mainCatId = insertRes[0].id;
        } else {
            console.log(`${mainCatName} category already exists.`);
            mainCatId = mainCatRes[0].id;
        }

        // Create Subcategories
        for (const sub of subCats) {
            const subRes = await queryRunner.query(
                `SELECT id FROM categories WHERE name = $1 AND "parent_category_id" = $2`,
                [sub, mainCatId]
            );

            if (subRes.length === 0) {
                console.log(`Creating subcategory ${sub} for ${mainCatName}...`);
                await queryRunner.query(
                    `INSERT INTO categories (name, "parent_category_id") VALUES ($1, $2)`,
                    [sub, mainCatId]
                );
            } else {
                console.log(`Subcategory ${sub} already exists.`);
            }
        }
    }

    console.log('Seeding complete.');
    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
