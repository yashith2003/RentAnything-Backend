const { Client } = require('pg');

async function checkDatabase() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rent_anything_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, email, phone, role FROM users WHERE phone IN ('+94717954125', '0717954125', '0701060326', '+94701060326');");
    const indRes = await client.query("SELECT u.id as user_id, u.phone, iu.full_name FROM users u JOIN individual_users iu ON u.id = iu.user_id WHERE u.phone IN ('+94717954125', '0717954125', '0701060326', '+94701060326');");
    
    const results = {
      users: res.rows,
      individuals: indRes.rows
    };

    const path = require('path');
    const resultsPath = path.join(__dirname, 'db_results.json');
    require('fs').writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Results written to ${resultsPath}`);

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkDatabase();
