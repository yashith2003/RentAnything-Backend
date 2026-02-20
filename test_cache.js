// test/redis-cache-check.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3008/api';

async function testCache() {
  console.log('--- Starting Redis Cache Verification ---');

  try {
    // 1. Test Category Caching
    console.log('\n[1] Testing Category Caching...');
    const start1 = Date.now();
    await axios.get(`${BASE_URL}/categories`);
    const end1 = Date.now();
    console.log(`First call (potential miss): ${end1 - start1}ms`);

    const start2 = Date.now();
    await axios.get(`${BASE_URL}/categories`);
    const end2 = Date.now();
    console.log(`Second call (potential hit): ${end2 - start2}ms`);

    if (end2 - start2 < end1 - start1) {
      console.log('✅ Performance improvement detected (Cache Hit likely)');
    }

    // 2. Test Item Caching
    console.log('\n[2] Testing Item Caching...');
    const itemId = 22; // Use existing ID
    const start3 = Date.now();
    await axios.get(`${BASE_URL}/items/${itemId}`);
    const end3 = Date.now();
    console.log(`First item call: ${end3 - start3}ms`);

    const start4 = Date.now();
    await axios.get(`${BASE_URL}/items/${itemId}`);
    const end4 = Date.now();
    console.log(`Second item call: ${end4 - start4}ms`);
    
    if (end4 - start4 < end3 - start3) {
      console.log('✅ Performance improvement detected (Cache Hit likely)');
    }

    console.log('\n--- Verification Finished ---');
  } catch (error) {
    console.error('Test Failed:', error.message);
    if (error.response) console.log(error.response.data);
  }
}

testCache();
