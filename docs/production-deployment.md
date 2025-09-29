# Dokpod Production Deployment Guide

## Overview
This comprehensive guide will help you deploy Dokpod to production with all billing integrations, monitoring, and security features properly configured.

## Pre-Deployment Checklist

### System Requirements
- [ ] **Node.js:** v20.16.0 (current: v22.17.1 - needs alignment)
- [ ] **Docker & Docker Compose:** Latest stable version
- [ ] **PostgreSQL:** v14+ (or configured external instance)
- [ ] **Server Resources:** Minimum 4GB RAM, 50GB storage
- [ ] **Domain:** Properly configured with DNS pointing to server

### Network Requirements
- [ ] **Port 80:** Open for HTTP (Let's Encrypt validation)
- [ ] **Port 443:** Open for HTTPS
- [ ] **Port 22:** Open for SSH (secured)
- [ ] **Database Port:** Secured (if external database)

## Step-by-Step Deployment

### Step 1: Server Preparation

1. **Update System:**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   ```

2. **Install Dependencies:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Install Node.js v20.16.0
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install pnpm
   npm install -g pnpm
   ```

3. **Create Deployment User:**
   ```bash
   sudo adduser dokpod
   sudo usermod -aG docker dokpod
   sudo su - dokpod
   ```

### Step 2: Code Deployment

1. **Clone Repository:**
   ```bash
   git clone <your-repository-url> /home/dokpod/dokpod
   cd /home/dokpod/dokpod
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Build Application:**
   ```bash
   pnpm build
   ```

### Step 3: Environment Configuration

1. **Copy Environment Template:**
   ```bash
   cp apps/dokploy/.env.production.template apps/dokploy/.env
   ```

2. **Configure Environment Variables:**
   Edit `apps/dokploy/.env` with your production values:

   **Critical Variables to Update:**
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/dokpod_production
   
   # Domain & SSL
   NEXTAUTH_URL=https://your-domain.com
   TRAEFIK_ACME_EMAIL=your-email@domain.com
   
   # Billing Providers (enable as needed)
   WHMCS_ENABLED=true
   WHMCS_URL=https://your-whmcs.com
   WHMCS_USERNAME=your-admin-user
   WHMCS_PASSWORD=your-secure-password
   WHMCS_API_IDENTIFIER=your-api-id
   WHMCS_API_SECRET=your-api-secret
   
   # Security
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```

3. **Validate Configuration:**
   ```bash
   pnpm run validate-config
   ```

### Step 4: Database Setup

1. **Run Database Migration:**
   ```bash
   pnpm run db:migrate
   ```

2. **Verify Database:**
   ```bash
   pnpm run db:validate
   ```

3. **Setup Database Backups:**
   ```bash
   # Copy backup script
   sudo cp docs/backup-strategy.md /etc/cron.d/dokpod-backup
   
   # Make backup script executable
   chmod +x /usr/local/bin/backup-dokpod.sh
   ```

### Step 5: SSL Configuration

1. **Verify Domain Setup:**
   ```bash
   # Create domain verification script
   nano verify-domain.sh
   # Copy content from docs/ssl-configuration.md
   chmod +x verify-domain.sh
   ./verify-domain.sh
   ```

2. **SSL Configuration:**
   SSL will be automatically configured by Traefik once the application starts.

### Step 6: Application Startup

1. **Start Services:**
   ```bash
   pnpm run start:production
   # or use Docker Compose if configured
   docker-compose up -d
   ```

2. **Verify Startup:**
   ```bash
   # Check logs
   pnpm run logs
   
   # Check health status
   curl https://your-domain.com/api/health
   ```

### Step 7: Post-Deployment Verification

1. **Health Check:**
   ```bash
   curl -s https://your-domain.com/api/health | jq .
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "billing": "configured",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **SSL Verification:**
   ```bash
   curl -I https://your-domain.com
   # Should return 200 with SSL headers
   ```

3. **Billing Integration Test:**
   - Access admin panel: `https://your-domain.com/admin`
   - Test WHMCS connection
   - Verify webhook endpoints are accessible

## Monitoring Setup

### 1. Application Monitoring
The application includes built-in monitoring endpoints:

- **Health Check:** `GET /api/health`
- **System Status:** `GET /api/system/status`
- **Database Status:** `GET /api/database/health`
- **Billing Status:** `GET /api/billing/health`

### 2. External Monitoring (Optional)
Set up external monitoring services:

```bash
# Example: Simple uptime monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f https://your-domain.com/api/health || echo 'Health check failed' | mail -s 'Dokpod Alert' admin@domain.com") | crontab -
```

### 3. Log Management
Configure log rotation:

```bash
sudo tee /etc/logrotate.d/dokpod << EOF
/home/dokpod/dokpod/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 dokpod dokpod
    postrotate
        systemctl reload dokpod || true
    endrotate
}
EOF
```

## Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. SSH Security
```bash
# Disable root login and password authentication
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 3. Application Security
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys secured
- [ ] HTTPS enforced
- [ ] Security headers configured

## Backup Strategy

### 1. Database Backups
Automated daily backups are configured in `/usr/local/bin/backup-dokpod.sh`

### 2. Application Backups
```bash
# Create application backup
tar -czf dokpod-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /home/dokpod/dokpod
```

### 3. Environment Configuration Backup
```bash
# Backup configuration (excluding secrets)
cp apps/dokploy/.env apps/dokploy/.env.backup.$(date +%Y%m%d)
```

## Maintenance Tasks

### Daily
- [ ] Check health endpoints
- [ ] Monitor disk space
- [ ] Review error logs

### Weekly
- [ ] Update system packages
- [ ] Review backup integrity
- [ ] Check SSL certificate status

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Dependency updates

## Troubleshooting

### Common Issues

1. **Application won't start:**
   ```bash
   # Check logs
   pnpm run logs
   # Verify environment
   pnpm run validate-config
   # Check database connection
   pnpm run db:validate
   ```

2. **SSL certificate issues:**
   ```bash
   # Verify domain setup
   ./verify-domain.sh
   # Check Traefik logs
   docker logs traefik
   ```

3. **Database connection errors:**
   ```bash
   # Test database connectivity
   pnpm run db:test
   # Check database logs
   sudo journalctl -u postgresql
   ```

4. **Billing integration issues:**
   ```bash
   # Test billing endpoints
   curl https://your-domain.com/api/billing/health
   # Check webhook logs
   pnpm run logs:billing
   ```

### Getting Help
- Review logs in `/home/dokpod/dokpod/logs/`
- Check health monitoring endpoints
- Consult documentation in `/docs/` directory

## Deployment Complete! 🎉

Your Dokpod instance should now be running in production with:

- ✅ SSL/TLS encryption
- ✅ Database properly configured
- ✅ Billing integrations active
- ✅ Monitoring and health checks
- ✅ Automated backups
- ✅ Security hardening

**Next Steps:**
1. Set up your first deployment target
2. Configure billing plans in WHMCS
3. Test the complete deployment workflow
4. Set up monitoring alerts

**Remember:** Keep your environment variables secure and maintain regular backups!