
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'rent_anything_db'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, title, \"image_url\" FROM items');
    console.log('ITEM_DATA_START');
    res.rows.forEach(r => {
      console.log(`${r.id}|${r.title}|${r.image_url}`);
    });
    console.log('ITEM_DATA_END');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
