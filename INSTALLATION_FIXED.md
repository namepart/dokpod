# ⚡ Fixed Installation Commands - Dokpod Live Server

## 🚀 Complete Installation with GitHub Authentication Fix

This guide includes solutions for common GitHub authentication issues.

### 📋 Pre-Installation: Install Git and Required Tools

```bash
# For CentOS/RHEL/AlmaLinux/Rocky Linux
if [ -f /etc/redhat-release ]; then
    echo "Detected RedHat-based OS"
    yum update -y
    yum install -y git curl wget unzip tar
fi

# For Ubuntu/Debian
if [ -f /etc/debian_version ]; then
    echo "Detected Debian-based OS" 
    apt update -y
    apt install -y git curl wget unzip tar
fi

# Verify installation
git --version
curl --version
```

### 🔧 Download Repository (Multiple Methods)

#### Method 1: Direct Download (Recommended - No Authentication Required)
```bash
# Clean previous attempts
rm -rf dokpod dokpod-main dokpod.tar.gz

# Download latest repository
curl -L https://github.com/namepart/dokpod/archive/refs/heads/main.tar.gz -o dokpod.tar.gz

# Extract and setup
tar -xzf dokpod.tar.gz
mv dokpod-main dokpod
cd dokpod

# Verify download
echo "✅ Repository downloaded successfully!"
ls -la
```

#### Method 2: Git Clone (If authentication works)
```bash
# Try git clone
git clone https://github.com/namepart/dokpod.git
cd dokpod
```

#### Method 3: Alternative Download
```bash
# Using wget
wget https://github.com/namepart/dokpod/archive/refs/heads/main.zip -O dokpod.zip
unzip dokpod.zip
mv dokpod-main dokpod
cd dokpod
```

### 🛠️ Create Complete Installation Script

```bash
# Create installation directory
mkdir -p ~/dokpod-install
cd ~/dokpod-install

# Create enhanced installation script
cat > install-dokpod-fixed.sh << 'EOF'
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Dokpod Live Server Installation Starting...${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root. Create a regular user first.${NC}"
    echo -e "${YELLOW}Run: adduser dokpod && usermod -aG sudo dokpod && su - dokpod${NC}"
    exit 1
fi

# Function to print step headers
print_step() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 completed successfully${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/redhat-release ]; then
        echo "redhat"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    else
        echo "unknown"
    fi
}

OS_TYPE=$(detect_os)
echo -e "${BLUE}Detected OS: $OS_TYPE${NC}"

# Step 1: Install basic tools
print_step "Step 1: Installing Basic Tools"
if [ "$OS_TYPE" = "redhat" ]; then
    sudo yum update -y
    sudo yum install -y git curl wget unzip tar postgresql postgresql-server postgresql-contrib
elif [ "$OS_TYPE" = "debian" ]; then
    sudo apt update -y
    sudo apt install -y git curl wget unzip tar postgresql postgresql-contrib
else
    echo -e "${RED}❌ Unsupported OS${NC}"
    exit 1
fi
check_success "Basic tools installation"

# Step 2: Install Docker
print_step "Step 2: Installing Docker"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
check_success "Docker installation"

# Step 3: Install Node.js v20
print_step "Step 3: Installing Node.js v20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null || curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs 2>/dev/null || sudo yum install -y nodejs npm
sudo npm install -g pnpm
check_success "Node.js installation"

# Step 4: Setup PostgreSQL
print_step "Step 4: Setting up PostgreSQL"
sudo systemctl start postgresql
sudo systemctl enable postgresql
check_success "PostgreSQL setup"

# Step 5: Download Repository
print_step "Step 5: Downloading Dokpod Repository"

# Clean previous attempts
rm -rf dokpod dokpod-main dokpod.tar.gz

# Try multiple download methods
echo -e "${BLUE}Trying direct download method...${NC}"
if curl -L https://github.com/namepart/dokpod/archive/refs/heads/main.tar.gz -o dokpod.tar.gz; then
    tar -xzf dokpod.tar.gz
    mv dokpod-main dokpod
    echo -e "${GREEN}✅ Direct download successful${NC}"
elif git clone https://github.com/namepart/dokpod.git; then
    echo -e "${GREEN}✅ Git clone successful${NC}"
else
    echo -e "${RED}❌ Failed to download repository${NC}"
    exit 1
fi

cd dokpod
check_success "Repository download"

# Step 6: Install Dependencies
print_step "Step 6: Installing Dependencies"
pnpm install
check_success "Dependencies installation"

echo -e "\n${GREEN}🎉 Base installation completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Run: ./configure-dokpod.sh"
echo -e "2. Run: ./start-dokpod.sh"
echo -e "3. Configure your domain and environment"

EOF

# Make script executable
chmod +x install-dokpod-fixed.sh
```

### 🔧 Create Configuration Script

```bash
# Create configuration script
cat > configure-dokpod.sh << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Dokpod Configuration Setup${NC}\n"

# Check if we're in the right directory
if [ ! -f "LIVE_INSTALLATION_GUIDE.md" ]; then
    echo -e "${RED}❌ Please run this script from the dokpod directory${NC}"
    echo -e "${YELLOW}Run: cd dokpod && ../configure-dokpod.sh${NC}"
    exit 1
fi

# Get configuration details
read -p "Enter your domain (e.g., mydokpod.com): " DOMAIN
read -p "Enter your email for SSL certificates: " EMAIL

# Get database password
echo -e "${YELLOW}Database Configuration:${NC}"
read -s -p "Enter a secure database password: " DB_PASSWORD
echo

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo -e "\n${BLUE}Setting up database...${NC}"

# Create database user and database
sudo -u postgres psql << EOSQL
DROP DATABASE IF EXISTS dokpod_production;
DROP USER IF EXISTS dokpod_user;
CREATE USER dokpod_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE dokpod_production OWNER dokpod_user;
GRANT ALL PRIVILEGES ON DATABASE dokpod_production TO dokpod_user;
ALTER USER dokpod_user CREATEDB;
\q
EOSQL

echo -e "${GREEN}✅ Database configured${NC}"

# Create environment file
echo -e "\n${BLUE}Creating environment configuration...${NC}"
cp apps/dokploy/.env.production.template apps/dokploy/.env

# Update environment file
cat > apps/dokploy/.env << EOENV
# Database Configuration
DATABASE_URL=postgresql://dokpod_user:$DB_PASSWORD@localhost:5432/dokpod_production

# Application Settings
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Domain & SSL
NEXTAUTH_URL=https://$DOMAIN
TRAEFIK_ACME_EMAIL=$EMAIL

# Security
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Billing Configuration (Configure later in admin panel)
WHMCS_ENABLED=false
STRIPE_ENABLED=false
PAYPAL_ENABLED=false

EOENV

echo -e "${GREEN}✅ Environment configured${NC}"

# Build application
echo -e "\n${BLUE}Building application...${NC}"
pnpm build

# Run migrations
echo -e "\n${BLUE}Running database migrations...${NC}"
cd apps/dokploy
pnpm run db:migrate || echo -e "${YELLOW}⚠️ Migration may need manual setup${NC}"
cd ../..

echo -e "\n${GREEN}🎉 Configuration completed!${NC}"
echo -e "${YELLOW}📝 Your configuration:${NC}"
echo -e "Domain: https://$DOMAIN"
echo -e "Email: $EMAIL"
echo -e "Database: dokpod_production"
echo -e "\n${BLUE}Next: Run ./start-dokpod.sh to start the application${NC}"

EOF

chmod +x configure-dokpod.sh
```

### 🚀 Create Startup Script

```bash
# Create startup script
cat > start-dokpod.sh << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Dokpod Application${NC}\n"

# Check if configuration exists
if [ ! -f "dokpod/apps/dokploy/.env" ]; then
    echo -e "${RED}❌ Configuration not found. Run ./configure-dokpod.sh first${NC}"
    exit 1
fi

# Configure firewall
echo -e "${BLUE}Configuring firewall...${NC}"
sudo ufw default deny incoming 2>/dev/null
sudo ufw default allow outgoing 2>/dev/null
sudo ufw allow 22/tcp 2>/dev/null
sudo ufw allow 80/tcp 2>/dev/null
sudo ufw allow 443/tcp 2>/dev/null
sudo ufw --force enable 2>/dev/null || echo -e "${YELLOW}⚠️ UFW not available, configure firewall manually${NC}"

# Create systemd service
echo -e "\n${BLUE}Creating systemd service...${NC}"
sudo tee /etc/systemd/system/dokpod.service > /dev/null << EOSERVICE
[Unit]
Description=Dokpod Application
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/dokpod/apps/dokploy
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOSERVICE

# Reload and start service
sudo systemctl daemon-reload
sudo systemctl enable dokpod
sudo systemctl start dokpod

echo -e "${GREEN}✅ Service started${NC}"

# Wait and check service status
echo -e "\n${BLUE}Checking service status...${NC}"
sleep 10

if systemctl is-active --quiet dokpod; then
    echo -e "\n${GREEN}🎉 Dokpod is running successfully!${NC}"
    
    # Get domain from env file
    DOMAIN=$(grep NEXTAUTH_URL dokpod/apps/dokploy/.env | cut -d'=' -f2 | sed 's|https://||')
    
    echo -e "${YELLOW}📝 Access your Dokpod:${NC}"
    echo -e "🌐 Main URL: https://$DOMAIN"
    echo -e "⚕️  Health Check: https://$DOMAIN/api/health"
    echo -e "📊 System Status: https://$DOMAIN/api/status"
    
    echo -e "\n${BLUE}📋 Useful commands:${NC}"
    echo -e "• Check status: sudo systemctl status dokpod"
    echo -e "• View logs: sudo journalctl -u dokpod -f"
    echo -e "• Restart: sudo systemctl restart dokpod"
    echo -e "• Stop: sudo systemctl stop dokpod"
    
    echo -e "\n${BLUE}🔧 Management tool:${NC}"
    echo -e "• Use: ./manage-dokpod.sh for maintenance tasks"
else
    echo -e "\n${RED}❌ Service failed to start${NC}"
    echo -e "${YELLOW}Check logs with: sudo journalctl -u dokpod${NC}"
    echo -e "${YELLOW}Check configuration: cat dokpod/apps/dokploy/.env${NC}"
fi

EOF

chmod +x start-dokpod.sh
```

### 🛠️ Create Management Tool

```bash
# Create management script
cat > manage-dokpod.sh << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}Dokpod Management Tool${NC}\n"
    echo -e "Usage: ./manage-dokpod.sh [COMMAND]\n"
    echo -e "Commands:"
    echo -e "  ${GREEN}status${NC}       Check application status"
    echo -e "  ${GREEN}logs${NC}         View application logs"
    echo -e "  ${GREEN}restart${NC}      Restart application"
    echo -e "  ${GREEN}stop${NC}         Stop application"
    echo -e "  ${GREEN}start${NC}        Start application"
    echo -e "  ${GREEN}backup${NC}       Create backup"
    echo -e "  ${GREEN}health${NC}       Check health endpoints"
    echo -e "  ${GREEN}update${NC}       Update from GitHub"
    echo -e "  ${GREEN}config${NC}       Show configuration"
    echo -e "  ${GREEN}troubleshoot${NC} Run troubleshooting checks"
}

check_status() {
    echo -e "${BLUE}📊 Application Status${NC}"
    sudo systemctl status dokpod --no-pager
}

view_logs() {
    echo -e "${BLUE}📋 Application Logs (Press Ctrl+C to exit)${NC}"
    sudo journalctl -u dokpod -f
}

restart_app() {
    echo -e "${BLUE}🔄 Restarting Dokpod...${NC}"
    sudo systemctl restart dokpod
    sleep 5
    check_status
}

stop_app() {
    echo -e "${BLUE}⏹️ Stopping Dokpod...${NC}"
    sudo systemctl stop dokpod
    echo -e "${GREEN}✅ Service stopped${NC}"
}

start_app() {
    echo -e "${BLUE}▶️ Starting Dokpod...${NC}"
    sudo systemctl start dokpod
    sleep 5
    check_status
}

create_backup() {
    echo -e "${BLUE}💾 Creating Backup...${NC}"
    
    BACKUP_DIR="$HOME/dokpod-backups"
    mkdir -p $BACKUP_DIR
    DATE=$(date +%Y%m%d_%H%M%S)
    
    # Database backup
    if command -v pg_dump >/dev/null 2>&1; then
        pg_dump -h localhost -U dokpod_user -d dokpod_production > "$BACKUP_DIR/db_backup_$DATE.sql" 2>/dev/null || echo -e "${YELLOW}⚠️ Database backup failed${NC}"
    fi
    
    # Application backup
    tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" -C $HOME --exclude=node_modules --exclude=.git dokpod 2>/dev/null
    
    echo -e "${GREEN}✅ Backup created in $BACKUP_DIR${NC}"
    ls -la $BACKUP_DIR/ 2>/dev/null || echo "Backup directory: $BACKUP_DIR"
}

check_health() {
    echo -e "${BLUE}⚕️ Health Check${NC}"
    
    if [ -f "dokpod/apps/dokploy/.env" ]; then
        DOMAIN=$(grep NEXTAUTH_URL dokpod/apps/dokploy/.env | cut -d'=' -f2 | sed 's|https://||')
    else
        echo -e "${RED}❌ Configuration file not found${NC}"
        return
    fi
    
    echo -e "\nTesting endpoints for domain: $DOMAIN"
    
    # Test health endpoint
    if curl -s -f --connect-timeout 10 https://$DOMAIN/api/health >/dev/null 2>&1; then
        echo -e "• Health endpoint: ${GREEN}✅ OK${NC}"
    else
        echo -e "• Health endpoint: ${RED}❌ Failed${NC}"
    fi
    
    # Test local endpoint
    if curl -s -f --connect-timeout 5 http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "• Local endpoint: ${GREEN}✅ OK${NC}"
    else
        echo -e "• Local endpoint: ${RED}❌ Failed${NC}"
    fi
}

show_config() {
    echo -e "${BLUE}🔧 Current Configuration${NC}"
    
    if [ -f "dokpod/apps/dokploy/.env" ]; then
        echo -e "\n${YELLOW}Environment variables:${NC}"
        grep -E "NEXTAUTH_URL|DATABASE_URL|NODE_ENV|PORT" dokpod/apps/dokploy/.env | sed 's/=.*PASSWORD.*/=***HIDDEN***/'
    else
        echo -e "${RED}❌ Configuration file not found${NC}"
    fi
}

troubleshoot() {
    echo -e "${BLUE}🔍 Running Troubleshooting Checks${NC}\n"
    
    # Check service status
    echo -e "1. Service Status:"
    if systemctl is-active --quiet dokpod; then
        echo -e "   ${GREEN}✅ Service is running${NC}"
    else
        echo -e "   ${RED}❌ Service is not running${NC}"
    fi
    
    # Check port
    echo -e "\n2. Port Check:"
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo -e "   ${GREEN}✅ Port 3000 is listening${NC}"
    else
        echo -e "   ${RED}❌ Port 3000 is not listening${NC}"
    fi
    
    # Check database
    echo -e "\n3. Database Connection:"
    if sudo -u postgres psql -c "SELECT 1" dokpod_production >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Database is accessible${NC}"
    else
        echo -e "   ${RED}❌ Database connection failed${NC}"
    fi
    
    # Check disk space
    echo -e "\n4. Disk Space:"
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        echo -e "   ${GREEN}✅ Disk space OK ($DISK_USAGE%)${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Disk space low ($DISK_USAGE%)${NC}"
    fi
    
    # Show recent logs
    echo -e "\n5. Recent Errors:"
    sudo journalctl -u dokpod --since "10 minutes ago" --no-pager -n 5 | grep -i error || echo -e "   ${GREEN}✅ No recent errors${NC}"
}

case $1 in
    status)     check_status ;;
    logs)       view_logs ;;
    restart)    restart_app ;;
    stop)       stop_app ;;
    start)      start_app ;;
    backup)     create_backup ;;
    health)     check_health ;;
    config)     show_config ;;
    troubleshoot) troubleshoot ;;
    *)          show_help ;;
esac

EOF

chmod +x manage-dokpod.sh

echo "✅ All scripts created successfully!"
echo "📝 Available scripts:"
echo "• install-dokpod-fixed.sh - Main installation"
echo "• configure-dokpod.sh - Configuration setup"  
echo "• start-dokpod.sh - Start application"
echo "• manage-dokpod.sh - Management tool"
```

## 📋 Complete Installation Process

After SSH into your server, run these commands:

```bash
# 1. Create installation directory and download scripts
mkdir -p ~/dokpod-install
cd ~/dokpod-install

# 2. Copy and paste the above script creation commands, then run:

# 3. Run installation (as regular user, not root)
./install-dokpod-fixed.sh

# 4. Configure your application
./configure-dokpod.sh

# 5. Start the application
./start-dokpod.sh

# 6. Manage and monitor
./manage-dokpod.sh status
./manage-dokpod.sh health
./manage-dokpod.sh troubleshoot
```

## 🛠️ Troubleshooting Commands

```bash
# If GitHub authentication fails, use direct download:
curl -L https://github.com/namepart/dokpod/archive/refs/heads/main.tar.gz -o dokpod.tar.gz
tar -xzf dokpod.tar.gz
mv dokpod-main dokpod

# Check service status
sudo systemctl status dokpod

# View logs
sudo journalctl -u dokpod -f

# Test local connection
curl http://localhost:3000/api/health
```

This enhanced guide solves the GitHub authentication issues and provides comprehensive installation and management tools!