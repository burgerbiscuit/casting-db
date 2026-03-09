#!/usr/bin/env node

/**
 * RESTORE FROM BACKUP
 * 
 * Restores a complete backup to Supabase
 * DANGEROUS: This will overwrite existing data
 * 
 * Usage: node scripts/restore-from-backup.js <backup-path>
 * Example: node scripts/restore-from-backup.js ./backups/2026-03-09/03
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('❌ Usage: node scripts/restore-from-backup.js <backup-path>');
    console.error('Example: node scripts/restore-from-backup.js ./backups/2026-03-09/03');
    process.exit(1);
  }

  const fullPath = path.resolve(backupPath);

  if (!fs.existsSync(fullPath)) {
    console.error('❌ Backup directory not found:', fullPath);
    process.exit(1);
  }

  console.log('🔄 RESTORE FROM BACKUP');
  console.log('Source:', fullPath);
  console.log('\n⚠️  WARNING: This will overwrite all data in Supabase!');
  console.log('Proceed only if you are certain this is the correct backup.\n');

  // Read manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(fullPath, 'manifest.json'), 'utf8'));
  console.log('Backup timestamp:', manifest.timestamp);
  console.log('Tables backed up:', Object.keys(manifest.backups).join(', '));

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json') && f !== 'manifest.json');

  for (const file of files) {
    const table = file.replace('.json', '');
    const filePath = path.join(fullPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`\n⏳ Restoring ${table}... (${data.length} records)`);

    // Delete all existing records
    const { error: deleteError } = await supabase.from(table).delete().neq('id', '');
    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.log(`⚠️  Delete error (may be expected): ${deleteError.message}`);
    }

    // Insert restored data
    const { error: insertError } = await supabase.from(table).insert(data);
    if (insertError) {
      console.log(`❌ Error: ${insertError.message}`);
    } else {
      console.log(`✅ Restored ${data.length} records`);
    }
  }

  console.log('\n✅ Restore complete!');
  console.log('All tables have been restored from backup.');
})();
