#!/usr/bin/env node

/**
 * HOURLY DATABASE BACKUP
 * 
 * Backs up all Supabase tables to local JSON files
 * Scheduled to run every hour via cron
 * 
 * Usage: node scripts/hourly-backup.js
 * Cron: 0 * * * * cd ~/Projects/casting-db && node scripts/hourly-backup.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://yayrsksrgrsjxcewwwlg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo';
const BACKUP_DIR = path.join(__dirname, '../backups');

const tables = [
  'models',
  'projects',
  'project_models',
  'presentations',
  'presentation_models',
  'client_shortlists',
  'team_members',
];

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const makeRequest = (table) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'yayrsksrgrsjxcewwwlg.supabase.co',
      path: `/rest/v1/${table}?limit=999999`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, error: e.message });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

(async () => {
  const timestamp = new Date().toISOString();
  const dateDir = path.join(BACKUP_DIR, new Date().toISOString().split('T')[0]);
  const hourDir = path.join(dateDir, new Date().getUTCHours().toString().padStart(2, '0'));

  // Create directories
  if (!fs.existsSync(hourDir)) {
    fs.mkdirSync(hourDir, { recursive: true });
  }

  console.log(`[${timestamp}] Starting hourly backup...`);
  console.log(`Backup directory: ${hourDir}`);

  const results = {
    timestamp,
    backups: {},
    errors: [],
  };

  for (const table of tables) {
    try {
      console.log(`  Backing up ${table}...`);
      const result = await makeRequest(table);

      if (result.status === 200 && Array.isArray(result.data)) {
        const filePath = path.join(hourDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
        
        results.backups[table] = {
          status: 'success',
          count: result.data.length,
          size: fs.statSync(filePath).size,
        };
        console.log(`  ✅ ${table}: ${result.data.length} records (${Math.round(fs.statSync(filePath).size / 1024)}KB)`);
      } else {
        results.errors.push({
          table,
          status: result.status,
          error: result.error || 'Unknown error',
        });
        console.log(`  ❌ ${table}: ${result.status} - ${result.error || 'Unknown error'}`);
      }
    } catch (e) {
      results.errors.push({ table, error: e.message });
      console.log(`  ❌ ${table}: ${e.message}`);
    }
  }

  // Write manifest
  const manifestPath = path.join(hourDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));

  // Summary
  const successful = Object.keys(results.backups).length;
  const failed = results.errors.length;

  console.log(`\n[${timestamp}] Backup complete!`);
  console.log(`✅ Successful: ${successful}/${tables.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }

  // Cleanup old backups (keep last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const datesDirs = fs.readdirSync(BACKUP_DIR).filter(d => d.match(/\d{4}-\d{2}-\d{2}/));
  for (const dir of datesDirs) {
    if (dir < thirtyDaysAgo) {
      const dirPath = path.join(BACKUP_DIR, dir);
      try {
        fs.rmSync(dirPath, { recursive: true });
        console.log(`🗑️  Deleted old backup: ${dir}`);
      } catch (e) {
        console.log(`⚠️  Could not delete ${dir}: ${e.message}`);
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
})();
