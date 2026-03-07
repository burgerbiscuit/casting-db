#!/usr/bin/env node
/**
 * GOOGLE DRIVE BACKUP UPLOADER
 * 
 * Uploads daily database backups to Google Drive
 * Run after local backup: node scripts/backup-to-google-drive.js
 * 
 * Setup required (one-time):
 * 1. Install Google Drive CLI: npm install -g gdrive
 * 2. Authenticate: gdrive about
 * 3. Create folder: gdrive mkdir "Casting DB Backups"
 * 4. Update DRIVE_FOLDER_ID below with the folder ID
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// UPDATE THIS with your Google Drive folder ID
// To find it: gdrive mkdir "Casting DB Backups", then copy the ID from output
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE'; // Replace with actual ID

const BACKUP_DIR = path.join(process.env.HOME, '.openclaw/workspace/backups');
const LOG_FILE = path.join(process.env.HOME, '.openclaw/workspace/gdrive-backup.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function uploadBackupToGoogleDrive() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupPath = path.join(BACKUP_DIR, today);

  if (!fs.existsSync(backupPath)) {
    log(`❌ No backup found for today (${today})`);
    return;
  }

  log(`\n📤 UPLOADING BACKUP TO GOOGLE DRIVE`);
  log(`📅 Date: ${today}`);
  log(`📁 Local path: ${backupPath}\n`);

  if (DRIVE_FOLDER_ID === 'YOUR_DRIVE_FOLDER_ID_HERE') {
    log(`❌ ERROR: DRIVE_FOLDER_ID not configured`);
    log(`Please run setup first (see comments in script)`);
    return;
  }

  try {
    // Create a zip of today's backup
    const zipName = `casting-db-${today}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    log(`⏳ Creating zip file...`);
    try {
      await execAsync(`cd ${BACKUP_DIR} && zip -r ${zipName} ${today}`);
      log(`✅ Zip created: ${zipName}`);
    } catch (e) {
      // Zip might not be installed, try tar instead
      log(`⚠️  zip not found, using tar`);
      await execAsync(`cd ${BACKUP_DIR} && tar -czf ${zipName} ${today}`);
    }

    // Upload to Google Drive
    log(`⏳ Uploading to Google Drive...`);
    await execAsync(`gdrive upload --parent ${DRIVE_FOLDER_ID} ${zipPath}`);

    const fileSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
    log(`✅ UPLOAD COMPLETE: ${fileSize} MB\n`);

    // Delete local zip (keep uncompressed backup locally)
    fs.unlinkSync(zipPath);

    // Clean up old backups from Google Drive (keep 30 days)
    // This requires more complex gdrive queries, so we'll just log it
    log(`💡 Tip: Manually delete backups older than 30 days from Google Drive`);

  } catch (error) {
    log(`❌ UPLOAD FAILED: ${error.message}`);
    log(`\nTroubleshooting:`);
    log(`1. Is gdrive installed? Run: npm install -g gdrive`);
    log(`2. Is gdrive authenticated? Run: gdrive about`);
    log(`3. Did you set DRIVE_FOLDER_ID? Check the script comments`);
  }
}

uploadBackupToGoogleDrive().catch(console.error);
