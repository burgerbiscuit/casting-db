#!/usr/bin/env node

/**
 * Auto-purge deleted models after 30 days
 * Schedule this to run daily via cron or GitHub Actions
 * 
 * Add to crontab: 0 2 * * * cd /Users/tasha/Projects/casting-db && node scripts/trash-auto-purge.js
 * (runs at 2 AM every day)
 */

const https = require('https');

const apiUrl = 'https://cast.tashatongpreecha.com/api/admin/trash/auto-purge';
const apiKey = process.env.TRASH_PURGE_SECRET;

if (!apiKey) {
  console.error('❌ TRASH_PURGE_SECRET env var not set');
  process.exit(1);
}

const makeRequest = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

(async () => {
  try {
    console.log('🗑️  Starting trash auto-purge...');
    const result = await makeRequest();
    
    if (result.status === 200) {
      console.log('✅ Auto-purge complete');
      console.log(`   Purged: ${result.data.purged} models`);
      console.log(`   Timestamp: ${result.data.timestamp}`);
    } else {
      console.error('❌ Purge failed:', result.data);
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
