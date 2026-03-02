
const { Client } = require('pg');

async function checkDb() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rent_anything_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    
    const itemRes = await client.query('SELECT id, title, owner_id FROM items');
    console.log('--- ALL ITEMS IN DB ---');
    itemRes.rows.forEach(r => {
      console.log(`ID: ${r.id} | Title: "${r.title}" | Owner: ${r.owner_id}`);
    });

    const userRes = await client.query('SELECT id, email FROM users');
    console.log('--- ALL USERS IN DB ---');
    userRes.rows.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email}`);
    });

  } catch (err) {
    console.error('Connection error:', err.stack);
  } finally {
    await client.end();
  }
}

checkDb();
