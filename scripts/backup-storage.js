#!/usr/bin/env node
/**
 * STORAGE BACKUP SCRIPT
 *
 * Downloads all files from Supabase Storage 'model-media' bucket
 * and saves them locally. Incremental — only downloads files not yet backed up.
 *
 * Run daily via cron: 30 2 * * * cd ~/Projects/casting-db && node scripts/backup-storage.js >> ~/.openclaw/workspace/backups/storage-backup.log 2>&1
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
)

const BACKUP_DIR = path.join(process.env.HOME, '.openclaw/workspace/backups/storage/model-media')
const BUCKET = 'model-media'
const STATE_FILE = path.join(process.env.HOME, '.openclaw/workspace/backups/storage-state.json')

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(dest)
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        fs.unlinkSync(dest)
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

async function listAllFiles(prefix = '') {
  const files = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) { log('Error listing files: ' + error.message); break }
    if (!data || data.length === 0) break

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) {
        // It's a folder — recurse
        const subFiles = await listAllFiles(fullPath)
        files.push(...subFiles)
      } else {
        files.push({ path: fullPath, id: item.id, updated_at: item.updated_at })
      }
    }

    if (data.length < 1000) break
    offset += data.length
  }
  return files
}

async function backup() {
  log('Starting storage backup...')

  // Load state (tracks what we've already downloaded)
  let state = { downloaded: {} }
  if (fs.existsSync(STATE_FILE)) {
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) } catch (e) {}
  }

  // Ensure backup dir exists
  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  // List all files in the bucket
  log('Listing files in bucket...')
  const files = await listAllFiles()
  log(`Found ${files.length} files in bucket`)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const file of files) {
    const localPath = path.join(BACKUP_DIR, file.path)
    const localDir = path.dirname(localPath)

    // Skip if already downloaded and not changed
    if (state.downloaded[file.path] === file.id && fs.existsSync(localPath)) {
      skipped++
      continue
    }

    // Ensure directory exists
    fs.mkdirSync(localDir, { recursive: true })

    try {
      // Get public URL for download
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(file.path)
      await downloadFile(data.publicUrl, localPath)
      state.downloaded[file.path] = file.id
      downloaded++
      if (downloaded % 10 === 0) log(`Downloaded ${downloaded} files so far...`)
    } catch (err) {
      log(`Failed to download ${file.path}: ${err.message}`)
      failed++
    }
  }

  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))

  log(`Done. Downloaded: ${downloaded}, Skipped (already backed up): ${skipped}, Failed: ${failed}`)
  log(`Backup location: ${BACKUP_DIR}`)
}

backup().catch(err => {
  log('Backup failed: ' + err.message)
  process.exit(1)
})
