# 🚀 Dokpod Live Server Installation Guide - A to Z

## Overview
এই গাইড আপনাকে GitHub repository থেকে customized Dokpod একটি live server এ complete install করতে সাহায্য করবে।

## 📋 Prerequisites Checklist

### 🖥️ Server Requirements
- [ ] **VPS/Cloud Server**: DigitalOcean, Linode, Vultr, বা AWS
- [ ] **Minimum Specs**: 2 vCPU, 4GB RAM, 80GB SSD
- [ ] **Operating System**: Ubuntu 22.04 LTS (Recommended)
- [ ] **Root/Sudo Access**: Server administration access
- [ ] **Public IP**: Static IP address
- [ ] **Domain**: Your domain pointing to server IP

### 🌐 Domain & DNS Setup
- [ ] Domain purchased and configured
- [ ] A record pointing to your server IP
- [ ] DNS propagation completed (check with `dig your-domain.com`)

### 💳 Billing Services Setup (Optional)
- [ ] **WHMCS**: Account and API credentials
- [ ] **Stripe**: Account and API keys (test/live)
- [ ] **PayPal**: Developer account and credentials

## 🛠️ Step-by-Step Installation

### Step 1: Server Preparation

#### 1.1 Connect to Your Server
```bash
ssh root@your-server-ip
# Or with key: ssh -i your-key.pem root@your-server-ip
```

#### 1.2 Update System
```bash
# Update package lists
apt update && apt upgrade -y

# Install basic utilities
apt install -y curl wget git unzip software-properties-common
```

#### 1.3 Create Deployment User
```bash
# Create dokpod user
adduser dokpod
usermod -aG sudo dokpod

# Switch to dokpod user
su - dokpod
```

### Step 2: Install Dependencies

#### 2.1 Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker dokpod

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2.2 Install Node.js v20.16.0
```bash
# Install Node.js v20.16.0 (exact version required)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

#### 2.3 Install pnpm
```bash
# Install pnpm globally
sudo npm install -g pnpm

# Verify installation
pnpm --version
```

### Step 3: Clone and Setup Repository

#### 3.1 Clone Repository
```bash
# Clone your customized Dokpod repository
cd /home/dokpod
git clone https://github.com/namepart/dokpod.git
cd dokpod

# Verify repository contents
ls -la
```

#### 3.2 Install Dependencies
```bash
# Install all project dependencies
pnpm install

# This may take several minutes
```

### Step 4: Environment Configuration

#### 4.1 Create Production Environment File
```bash
# Copy environment template
cp apps/dokploy/.env.production.template apps/dokploy/.env

# Edit environment file
nano apps/dokploy/.env
```

#### 4.2 Configure Environment Variables

Edit the `.env` file with your production values:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL=postgresql://dokpod_user:your_secure_db_password@localhost:5432/dokpod_production

# ===========================================
# APPLICATION SETTINGS  
# ===========================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ===========================================
# DOMAIN & SSL CONFIGURATION
# ===========================================
NEXTAUTH_URL=https://your-domain.com
TRAEFIK_ACME_EMAIL=your-email@domain.com

# ===========================================
# SECURITY
# ===========================================
NEXTAUTH_SECRET=your_very_secure_random_string_here_minimum_32_chars

# ===========================================
# BILLING CONFIGURATION (Configure as needed)
# ===========================================

# WHMCS Integration (Enable if using WHMCS)
WHMCS_ENABLED=true
WHMCS_URL=https://your-whmcs-domain.com
WHMCS_USERNAME=your_whmcs_admin_username
WHMCS_PASSWORD=your_whmcs_admin_password
WHMCS_API_IDENTIFIER=your_whmcs_api_identifier
WHMCS_API_SECRET=your_whmcs_api_secret

# Stripe Integration (Enable if using Stripe)
STRIPE_ENABLED=true
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal Integration (Enable if using PayPal)
PAYPAL_ENABLED=true
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_MODE=live

# ===========================================
# DOCKER CONFIGURATION
# ===========================================
DOCKER_HOST=unix:///var/run/docker.sock
```

#### 4.3 Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Copy the generated secret to your .env file
```

### Step 5: Database Setup

#### 5.1 Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 5.2 Configure Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console, run:
CREATE USER dokpod_user WITH PASSWORD 'your_secure_db_password';
CREATE DATABASE dokpod_production OWNER dokpod_user;
GRANT ALL PRIVILEGES ON DATABASE dokpod_production TO dokpod_user;
\q
```

#### 5.3 Update Database URL
Make sure your `DATABASE_URL` in `.env` matches:
```env
DATABASE_URL=postgresql://dokpod_user:your_secure_db_password@localhost:5432/dokpod_production
```

### Step 6: Build and Deploy

#### 6.1 Build Application
```bash
# Build the application
pnpm build

# This may take several minutes and might show some warnings
# The main dokploy app should build successfully
```

#### 6.2 Run Database Migration
```bash
# Navigate to dokploy app
cd apps/dokploy

# Run database migrations
pnpm run db:migrate
```

#### 6.3 Validate Configuration
```bash
# Run configuration validation
node -e "
const { validateProductionConfig, validateSSLConfig, getConfigSummary } = require('./lib/config-helpers');
const summary = getConfigSummary();
console.log('Production Ready:', summary.overall.readyForProduction);
console.log('Errors:', summary.overall.totalErrors);
console.log('Warnings:', summary.overall.totalWarnings);
"
```

### Step 7: SSL and Domain Configuration

#### 7.1 Verify Domain Setup
```bash
# Create domain verification script
nano ~/verify-domain.sh

# Add content:
#!/bin/bash
DOMAIN="your-domain.com"
SERVER_IP=$(curl -s ifconfig.me)

echo "🔍 Verifying domain: $DOMAIN"
echo "Server IP: $SERVER_IP"

RESOLVED_IP=$(dig +short $DOMAIN)
echo "Resolved IP: $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS setup correct"
else
    echo "❌ DNS needs configuration"
fi
```

```bash
# Make executable and run
chmod +x ~/verify-domain.sh
~/verify-domain.sh
```

#### 7.2 Configure Firewall
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (for SSL validation)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Check firewall status
sudo ufw status
```

### Step 8: Start the Application

#### 8.1 Create Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/dokpod.service

# Add content:
[Unit]
Description=Dokpod Application
After=network.target postgresql.service

[Service]
Type=simple
User=dokpod
WorkingDirectory=/home/dokpod/dokpod/apps/dokploy
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 8.2 Start and Enable Service
```bash
# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable dokpod
sudo systemctl start dokpod

# Check service status
sudo systemctl status dokpod
```

#### 8.3 Monitor Logs
```bash
# View real-time logs
sudo journalctl -u dokpod -f

# Check recent logs
sudo journalctl -u dokpod --since "10 minutes ago"
```

### Step 9: Verification and Testing

#### 9.1 Health Check
```bash
# Test application health
curl http://localhost:3000/api/health

# Should return JSON with status: "healthy"
```

#### 9.2 External Access Test
```bash
# Test external access
curl https://your-domain.com/api/health

# Should return healthy status with SSL
```

#### 9.3 Test Billing Endpoints (if configured)
```bash
# Test billing integration
curl https://your-domain.com/api/health/billing

# Should return billing service status
```

### Step 10: Backup Setup

#### 10.1 Create Backup Script
```bash
# Create backup directory
sudo mkdir -p /opt/backups/dokpod

# Create backup script
sudo nano /opt/backups/dokpod/backup.sh

# Add content:
#!/bin/bash
BACKUP_DIR="/opt/backups/dokpod"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h localhost -U dokpod_user -d dokpod_production > "$BACKUP_DIR/db_backup_$DATE.sql"

# Application backup
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" -C /home/dokpod --exclude=node_modules --exclude=.git dokpod

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

#### 10.2 Schedule Backups
```bash
# Make backup script executable
sudo chmod +x /opt/backups/dokpod/backup.sh

# Add to crontab
sudo crontab -e

# Add line (daily backup at 2 AM):
0 2 * * * /opt/backups/dokpod/backup.sh >> /var/log/dokpod-backup.log 2>&1
```

### Step 11: Monitoring Setup

#### 11.1 Create Monitoring Script
```bash
# Create monitoring script
nano ~/monitor-dokpod.sh

# Add content:
#!/bin/bash
DOMAIN="your-domain.com"
LOG_FILE="/var/log/dokpod-monitor.log"

# Check if service is running
if ! systemctl is-active --quiet dokpod; then
    echo "$(date): Dokpod service is down!" >> $LOG_FILE
    sudo systemctl start dokpod
fi

# Check if application responds
if ! curl -f -s https://$DOMAIN/api/health > /dev/null; then
    echo "$(date): Dokpod application not responding!" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi
```

#### 11.2 Schedule Monitoring
```bash
# Make monitoring script executable
chmod +x ~/monitor-dokpod.sh

# Add to crontab (check every 5 minutes)
crontab -e

# Add line:
*/5 * * * * /home/dokpod/monitor-dokpod.sh
```

## 🎉 Installation Complete!

### ✅ Verification Checklist

- [ ] **Application Running**: `sudo systemctl status dokpod` shows active
- [ ] **Health Check**: `curl https://your-domain.com/api/health` returns healthy
- [ ] **SSL Working**: Browser shows secure connection
- [ ] **Database Connected**: No database errors in logs
- [ ] **Billing Services**: Configured services respond correctly
- [ ] **Backups Scheduled**: Daily backups configured
- [ ] **Monitoring Active**: Health monitoring in place

### 🔧 Post-Installation

#### Access Your Dokpod Installation
- **Main URL**: https://your-domain.com
- **Admin Panel**: https://your-domain.com/admin
- **Health Check**: https://your-domain.com/api/health
- **System Status**: https://your-domain.com/api/status

#### Next Steps
1. **Create Admin Account**: Access your Dokpod installation and set up admin user
2. **Configure Billing**: Set up your billing plans and pricing in admin panel
3. **Test Deployments**: Create your first deployment to test functionality
4. **Monitor Performance**: Keep an eye on logs and system resources

## 🆘 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
sudo journalctl -u dokpod --since "10 minutes ago"

# Check environment
cd /home/dokpod/dokpod/apps/dokploy
node -e "console.log('Environment loaded:', !!process.env.DATABASE_URL)"

# Restart service
sudo systemctl restart dokpod
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U dokpod_user -d dokpod_production

# Check database service
sudo systemctl status postgresql
```

#### SSL Certificate Issues
```bash
# Check domain DNS
dig your-domain.com

# Verify firewall
sudo ufw status

# Check application logs for SSL errors
sudo journalctl -u dokpod | grep -i ssl
```

#### Build Errors
```bash
# Clean and rebuild
cd /home/dokpod/dokpod
pnpm clean
pnpm install
pnpm build
```

### Getting Help
- Check logs: `sudo journalctl -u dokpod -f`
- Monitor health: `curl https://your-domain.com/api/health`
- Review configuration: Ensure all environment variables are set correctly

## 🎯 Success! Your Customized Dokpod is Live!

আপনার custom billing system এবং monitoring সহ Dokpod এখন live server এ successfully install হয়েছে! 🚀

**Features Active:**
- ✅ Custom billing integration (WHMCS, Stripe, PayPal)
- ✅ Health monitoring and alerts
- ✅ SSL certificate management
- ✅ Database backup system
- ✅ Production-ready configuration

**Ready for Production Use!** 🎉