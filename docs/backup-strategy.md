# Database Backup Strategy for Dokpod

## Overview
This document outlines the database backup and recovery strategy for your Dokpod production deployment.

## Backup Types

### 1. Daily Automated Backups
```bash
#!/bin/bash
# backup-daily.sh - Place this in your server cron

DB_NAME="dokpod_production"
DB_USER="dokpod_user" 
BACKUP_DIR="/opt/dokpod/backups/daily"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create SQL dump
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/dokpod_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/dokpod_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: dokpod_backup_$DATE.sql.gz"
```

### 2. Weekly Full Backups
```bash
#!/bin/bash
# backup-weekly.sh - Place this in your server cron

DB_NAME="dokpod_production"
DB_USER="dokpod_user"
BACKUP_DIR="/opt/dokpod/backups/weekly"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Create full backup with custom format for faster restore
pg_dump -U $DB_USER -h localhost -F c $DB_NAME > $BACKUP_DIR/dokpod_full_backup_$DATE.dump

# Keep last 4 weeks of backups
find $BACKUP_DIR -name "*.dump" -mtime +28 -delete

echo "Weekly backup completed: dokpod_full_backup_$DATE.dump"
```

## Cron Schedule Setup

Add these lines to your server crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * /opt/dokpod/scripts/backup-daily.sh >> /var/log/dokpod-backup.log 2>&1

# Weekly backup on Sunday at 1 AM  
0 1 * * 0 /opt/dokpod/scripts/backup-weekly.sh >> /var/log/dokpod-backup.log 2>&1
```

## Recovery Procedures

### Restore from Daily Backup
```bash
# 1. Stop Dokpod services
docker stop dokpod-container-name

# 2. Drop and recreate database (CAUTION!)
psql -U postgres -c "DROP DATABASE dokpod_production;"
psql -U postgres -c "CREATE DATABASE dokpod_production OWNER dokpod_user;"

# 3. Restore from backup
gunzip -c /opt/dokpod/backups/daily/dokpod_backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U dokpod_user dokpod_production

# 4. Start Dokpod services
docker start dokpod-container-name
```

### Restore from Weekly Backup
```bash
# Using custom format backup (faster)
pg_restore -U dokpod_user -d dokpod_production -c /opt/dokpod/backups/weekly/dokpod_full_backup_YYYYMMDD.dump
```

## Backup Verification Script

```bash
#!/bin/bash
# verify-backup.sh - Test backup integrity

LATEST_BACKUP=$(ls -t /opt/dokpod/backups/daily/*.sql.gz | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    echo "Testing backup integrity: $LATEST_BACKUP"
    
    # Test if backup can be unzipped and contains valid SQL
    if gunzip -t "$LATEST_BACKUP" && gunzip -c "$LATEST_BACKUP" | head -5 | grep -q "PostgreSQL"; then
        echo "✅ Backup integrity check PASSED"
        exit 0
    else
        echo "❌ Backup integrity check FAILED"
        exit 1
    fi
else
    echo "❌ No backup file found"
    exit 1
fi
```

## Monitoring Backup Health

Add this check to your monitoring system:

```bash
# Check if backup was created today
BACKUP_TODAY=$(find /opt/dokpod/backups/daily -name "*$(date +%Y%m%d)*.sql.gz" | wc -l)

if [ $BACKUP_TODAY -eq 0 ]; then
    echo "❌ ALERT: No backup created today!"
    # Send notification (email, Slack, etc.)
else
    echo "✅ Today's backup found"
fi
```

## Important Notes

1. **Test Restores Regularly**: Perform monthly restore tests on a separate test database
2. **Off-site Backups**: Consider copying backups to cloud storage (AWS S3, Google Cloud, etc.)
3. **Encryption**: For sensitive data, encrypt backups before storage
4. **Monitoring**: Set up alerts for backup failures
5. **Documentation**: Keep recovery procedures updated and accessible

## Integration with Dokpod Health Monitoring

The backup status can be integrated with your existing health monitoring:

```typescript
// Add to health-monitoring.ts (optional enhancement)
export async function checkBackupHealth(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  lastBackup: string | null;
  backupAge: number; // hours
}> {
  // Implementation to check backup file timestamps
  // This is optional and can be added later if needed
}
```

## Quick Setup Commands

```bash
# Create backup directories
sudo mkdir -p /opt/dokpod/backups/{daily,weekly}
sudo mkdir -p /opt/dokpod/scripts

# Copy backup scripts to server
sudo cp backup-*.sh /opt/dokpod/scripts/
sudo chmod +x /opt/dokpod/scripts/*.sh

# Test backup immediately
sudo /opt/dokpod/scripts/backup-daily.sh
```

This backup strategy ensures your Dokpod data is protected without introducing complexity to your application code.