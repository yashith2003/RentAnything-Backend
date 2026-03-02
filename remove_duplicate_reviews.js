const { Client } = require('pg');

async function cleanReviews() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rent_anything_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Query to find duplicates
    const findDuplicates = `
      SELECT reviewer_id, item_id, COUNT(*) as count
      FROM reviews
      GROUP BY reviewer_id, item_id
      HAVING COUNT(*) > 1;
    `;
    const res = await client.query(findDuplicates);
    console.log(`Found ${res.rows.length} duplicate pairs causing issues.`);

    if (res.rows.length > 0) {
      // Delete duplicates keeping only the latest one (highest id)
      const complexDelete = `
        DELETE FROM reviews
        WHERE id IN (
          SELECT id
          FROM (
            SELECT id,
            ROW_NUMBER() OVER (PARTITION BY reviewer_id, item_id ORDER BY id DESC) as row_num
            FROM reviews
          ) t
          WHERE t.row_num > 1
        );
      `;
      
      const deleteRes = await client.query(complexDelete);
      console.log(`Successfully deleted ${deleteRes.rowCount} duplicate records from the "reviews" table.`);
    } else {
      console.log('No duplicate reviews found. The issue might be elsewhere or already fixed.');
    }

  } catch (err) {
    console.error('Error during database cleanup:', err.message);
  } finally {
    await client.end();
  }
}

cleanReviews();
