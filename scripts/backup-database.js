#!/usr/bin/env node
/**
 * DAILY DATABASE BACKUP SCRIPT
 * 
 * Exports all critical tables to JSON backups
 * Run daily via cron: 0 2 * * * cd ~/Projects/casting-db && node scripts/backup-database.js
 * (Runs at 2 AM EST every day)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

const BACKUP_DIR = path.join(process.env.HOME, '.openclaw/workspace/backups');
const TABLES = ['models', 'model_media', 'project_models', 'projects', 'presentations', 'agency_contacts'];

async function backup() {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupPath = path.join(BACKUP_DIR, timestamp);

  // Create backup directory
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  console.log(`\n📦 STARTING DATABASE BACKUP`);
  console.log(`📅 Date: ${timestamp}`);
  console.log(`📍 Location: ${backupPath}\n`);

  const manifest = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const table of TABLES) {
    try {
      console.log(`⏳ Backing up ${table}...`);

      // Fetch all records
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.error(`  ❌ Error:`, error);
        continue;
      }

      // Write JSON
      const filename = `${table}.json`;
      const filePath = path.join(backupPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data || [], null, 2));

      // Compress to .gz
      const gzPath = filePath + '.gz';
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(zlib.createGzip())
          .pipe(fs.createWriteStream(gzPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      // Remove uncompressed (keep only .gz)
      fs.unlinkSync(filePath);

      const sizeKb = (fs.statSync(gzPath).size / 1024).toFixed(2);
      console.log(`  ✅ ${table}: ${count} records (${sizeKb} KB compressed)`);

      manifest.tables[table] = {
        count,
        file: `${filename}.gz`,
        sizeKb: parseFloat(sizeKb),
      };
    } catch (e) {
      console.error(`  ❌ ${table}: ${e.message}`);
    }
  }

  // Write manifest
  const manifestPath = path.join(backupPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Verify backups exist
  const files = fs.readdirSync(backupPath);
  const totalSize = files.reduce((sum, f) => {
    const filePath = path.join(backupPath, f);
    return sum + (fs.statSync(filePath).size || 0);
  }, 0);

  console.log(`\n✅ BACKUP COMPLETE`);
  console.log(`📊 Files: ${files.length}`);
  console.log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 Backup dir: ${backupPath}\n`);

  // Keep only last 30 days
  cleanOldBackups();
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const dirDate = new Date(file); // format: YYYY-MM-DD
      if (dirDate < thirtyDaysAgo) {
        console.log(`🗑️  Deleting old backup: ${file}`);
        fs.rmSync(filePath, { recursive: true });
      }
    }
  });
}

backup().catch(console.error);
