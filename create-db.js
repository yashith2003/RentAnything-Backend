//create-db.js

const { Client } = require('pg');
require('dotenv').config();

async function createDb() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    const dbName = process.env.DB_DATABASE;
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully.`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database "${process.env.DB_DATABASE}" already exists.`);
    } else {
      console.error('Error creating database:', err);
    }
  } finally {
    await client.end();
  }
}

createDb();
