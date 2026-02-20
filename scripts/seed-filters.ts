
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

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Raw SQL to update FilterInputType enum if needed
    try {
        await queryRunner.query(`ALTER TYPE "filter_configs_type_enum" ADD VALUE IF NOT EXISTS 'slider'`);
        await queryRunner.query(`ALTER TYPE "filter_configs_type_enum" ADD VALUE IF NOT EXISTS 'date'`);
        await queryRunner.query(`ALTER TYPE "filter_configs_type_enum" ADD VALUE IF NOT EXISTS 'color-select'`);
        console.log('Enum types updated.');
    } catch (e) {
        console.warn('Enum update warning (may already exist):', e.message);
    }

    // Helper to get category ID by name
    const getCatId = async (name: string) => {
        const res = await queryRunner.query('SELECT id FROM categories WHERE name = $1', [name]);
        return res[0]?.id;
    };

    const vehicleId = await getCatId('Vehicle');
    const electronicsId = await getCatId('Electronics');
    const homeId = await getCatId('Home');
    const fashionId = await getCatId('Fashion');
    const sportsId = await getCatId('Sport');

    if (!vehicleId || !electronicsId || !homeId || !fashionId || !sportsId) {
        console.error('Categories not found. Please run seed-categories.ts first.');
        process.exit(1);
    }

    const filters = [
        // Vehicle Filters
        {
            categoryId: vehicleId,
            label: 'Vehicle Type',
            key: 'vehicleType',
            type: 'select',
            options: ['Car', 'Van', 'Bus', 'SUV', 'Motorbike', 'Truck']
        },
        {
            categoryId: vehicleId,
            label: 'Fuel Type',
            key: 'fuelType',
            type: 'select',
            options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Gas']
        },
        {
            categoryId: vehicleId,
            label: 'Seating Capacity',
            key: 'seatingCapacity',
            type: 'select',
            options: ['2', '4', '6', '8', '10']
        },
        {
            categoryId: vehicleId,
            label: 'Colors',
            key: 'colors',
            type: 'color-select',
            options: ['White', 'Gray', 'Blue', 'Black']
        },
        {
            categoryId: vehicleId,
            label: 'Book with driver',
            key: 'bookWithDriver',
            type: 'toggle',
            options: []
        },
        {
            categoryId: vehicleId,
            label: 'Trust & Verification',
            key: 'verification',
            type: 'multi-select',
            options: ['NIC', 'Driving License', 'Passport']
        },

        // Electronics Filters
        {
            categoryId: electronicsId,
            label: 'Brand',
            key: 'brand',
            type: 'select',
            options: ['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'Other']
        },
        {
            categoryId: electronicsId,
            label: 'Warranty',
            key: 'warranty',
            type: 'select',
            options: ['Under Warranty', 'No Warranty']
        },
        {
            categoryId: electronicsId,
            label: 'Trust & Verification',
            key: 'verification',
            type: 'multi-select',
            options: ['Verified Seller', 'NIC', 'Business Registered']
        },
        {
            categoryId: electronicsId,
            label: 'Access to Rentals',
            key: 'access',
            type: 'multi-select',
            options: ['Delivery available', "Pickup at owner's location"]
        },

        // Home Filters
        {
            categoryId: homeId,
            label: 'Home Type',
            key: 'homeType',
            type: 'select',
            options: ['Furniture', 'Appliances', 'Tools', 'Décor']
        },
        {
            categoryId: homeId,
            label: 'Room Type',
            key: 'roomType',
            type: 'multi-select',
            options: ['Living Room', 'Bedroom', 'Kitchen', 'Outdoor']
        },
        {
            categoryId: homeId,
            label: 'Delivery Option',
            key: 'delivery',
            type: 'select',
            options: ['Delivery available', 'Pickup only']
        },

        // Fashion Filters
        {
            categoryId: fashionId,
            label: 'Gender',
            key: 'gender',
            type: 'select',
            options: ['Male', 'Female', 'Unisex']
        },
        {
            categoryId: fashionId,
            label: 'Size',
            key: 'size',
            type: 'select',
            options: ['XS', 'S', 'M', 'L', 'XL']
        },
        {
            categoryId: fashionId,
            label: 'Occasion',
            key: 'occasion',
            type: 'select',
            options: ['Casual', 'Formal', 'Wedding', 'Party']
        },
        {
            categoryId: fashionId,
            label: 'Brand',
            key: 'brand',
            type: 'text',
            options: []
        },

        // Sports Filters
        {
            categoryId: sportsId,
            label: 'Sport Type',
            key: 'sportType',
            type: 'select',
            options: ['Cricket', 'Football', 'Tennis', 'Gym', 'Cycling', 'Camping']
        },
        {
            categoryId: sportsId,
            label: 'Equipment Type',
            key: 'equipmentType',
            type: 'select',
            options: ['Individual gear', 'Team equipment']
        },
        {
            categoryId: sportsId,
            label: 'Skill Level',
            key: 'skillLevel',
            type: 'select',
            options: ['Beginner', 'Intermediate', 'Professional']
        }
    ];

    console.log('Clearing old filters...');
    await queryRunner.query('DELETE FROM filter_configs');

    for (const f of filters) {
        console.log(`Creating filter: ${f.label} for category ${f.categoryId}`);
        await queryRunner.query(
            `INSERT INTO filter_configs (label, key, type, options, category_id) VALUES ($1, $2, $3, $4, $5)`,
            [f.label, f.key, f.type, JSON.stringify(f.options), f.categoryId]
        );
    }

    console.log('Filter seeding complete.');
    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();

