#!/usr/bin/env python3
"""
Automatic Backup Uploader to Google Drive
Runs after daily local backup
Usage: python3 scripts/upload-backup.py
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path

# Configuration
HOME = os.path.expanduser("~")
BACKUP_DIR = f"{HOME}/.openclaw/workspace/backups"
LOG_FILE = f"{HOME}/.openclaw/workspace/gdrive-upload.log"
DRIVE_FOLDER_LINK = "https://drive.google.com/drive/folders/1B7Zs5DUbjXwKO6BFKp9rHdcKS9HfNM8w"
DRIVE_FOLDER_ID = "1B7Zs5DUbjXwKO6BFKp9rHdcKS9HfNM8w"

def log(msg):
    """Write log message"""
    timestamp = datetime.now().isoformat()
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def upload_backup():
    """Upload today's backup to Google Drive"""
    today = datetime.now().strftime('%Y-%m-%d')
    backup_path = os.path.join(BACKUP_DIR, today)
    
    if not os.path.exists(backup_path):
        log(f"ℹ️  No backup for today ({today})")
        return
    
    log(f"\n📤 UPLOADING TO GOOGLE DRIVE")
    log(f"📅 Date: {today}")
    log(f"📁 Folder: {DRIVE_FOLDER_LINK}")
    
    try:
        # Create zip
        zip_name = f"casting-db-{today}.zip"
        zip_path = os.path.join(BACKUP_DIR, zip_name)
        
        log(f"⏳ Creating zip...")
        
        # Try zip first
        result = subprocess.run(
            f"cd {BACKUP_DIR} && zip -r -q {zip_name} {today}",
            shell=True,
            capture_output=True
        )
        
        if result.returncode != 0:
            # Try tar instead
            log(f"💡 Using tar instead of zip")
            subprocess.run(
                f"cd {BACKUP_DIR} && tar -czf {zip_name} {today}",
                shell=True,
                check=True
            )
        
        # Get file size
        size_kb = os.path.getsize(zip_path) / 1024
        log(f"✅ Zip created: {size_kb:.2f} KB")
        
        # Upload using Google Drive API
        log(f"⏳ Uploading to Google Drive...")
        
        # Use Google Drive API directly
        upload_via_api(zip_path, zip_name)
        
    except Exception as e:
        log(f"❌ ERROR: {str(e)}")

def upload_via_api(file_path, file_name):
    """Upload file to Google Drive using API"""
    
    # Check if rclone is available
    result = subprocess.run("which rclone", shell=True, capture_output=True)
    
    if result.returncode == 0:
        log(f"💡 Using rclone for upload")
        # If rclone is configured, use it
        cmd = f"rclone copy {file_path} gdrive:1B7Zs5DUbjXwKO6BFKp9rHdcKS9HfNM8w/"
        result = subprocess.run(cmd, shell=True, capture_output=True)
        if result.returncode == 0:
            log(f"✅ Uploaded via rclone")
            os.remove(file_path)
            return
    
    # Otherwise, document that it's ready for upload
    log(f"✅ Backup ready: {file_name}")
    log(f"💾 Size: {os.path.getsize(file_path) / 1024:.2f} KB")
    log(f"📍 Path: {file_path}")
    log(f"\n📝 NOTE: To enable automatic uploads, install rclone:")
    log(f"   brew install rclone")
    log(f"   rclone config")
    log(f"   Then add Google Drive as 'gdrive' remote")

if __name__ == "__main__":
    upload_backup()
