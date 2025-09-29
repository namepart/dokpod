# ⚡ Quick Installation Commands - Dokpod Live Server

## 🚀 One-Command Setup Script

আপনার সুবিধার জন্য একটি automated installation script:

### Create Installation Script
```bash
# Create installation directory
mkdir -p ~/dokpod-install
cd ~/dokpod-install

# Create installation script
cat > install-dokpod.sh << 'EOF'
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
    echo -e "${RED}❌ Please don't run this script as root. Run as regular user with sudo access.${NC}"
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

# Step 1: System Update
print_step "Step 1: Updating System"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
check_success "System update"

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
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm
check_success "Node.js installation"

# Step 4: Install PostgreSQL
print_step "Step 4: Installing PostgreSQL"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
check_success "PostgreSQL installation"

# Step 5: Clone Repository
print_step "Step 5: Cloning Dokpod Repository"
if [ -d "dokpod" ]; then
    rm -rf dokpod
fi
git clone https://github.com/namepart/dokpod.git
cd dokpod
check_success "Repository cloning"

# Step 6: Install Dependencies
print_step "Step 6: Installing Dependencies"
pnpm install
check_success "Dependencies installation"

echo -e "\n${GREEN}🎉 Base installation completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Configure your environment variables in apps/dokploy/.env"
echo -e "2. Set up your database"
echo -e "3. Configure your domain and SSL"
echo -e "4. Start the application"
echo -e "\n${BLUE}Run: ./configure-dokpod.sh for guided configuration${NC}"

EOF

# Make the script executable
chmod +x install-dokpod.sh
```

### Create Configuration Script
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

# Get domain
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
CREATE USER dokpod_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE dokpod_production OWNER dokpod_user;
GRANT ALL PRIVILEGES ON DATABASE dokpod_production TO dokpod_user;
\q
EOSQL

echo -e "${GREEN}✅ Database configured${NC}"

# Create environment file
echo -e "\n${BLUE}Creating environment configuration...${NC}"
cd dokpod
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

# Billing Configuration (Configure later)
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
pnpm run db:migrate

echo -e "\n${GREEN}🎉 Configuration completed!${NC}"
echo -e "${YELLOW}📝 Your configuration:${NC}"
echo -e "Domain: https://$DOMAIN"
echo -e "Email: $EMAIL"
echo -e "Database: dokpod_production"
echo -e "\n${BLUE}Next: Run ./start-dokpod.sh to start the application${NC}"

EOF

chmod +x configure-dokpod.sh
```

### Create Startup Script
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

# Configure firewall
echo -e "${BLUE}Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

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

[Install]
WantedBy=multi-user.target
EOSERVICE

# Start service
sudo systemctl daemon-reload
sudo systemctl enable dokpod
sudo systemctl start dokpod

echo -e "${GREEN}✅ Service started${NC}"

# Check service status
sleep 5
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
else
    echo -e "\n${RED}❌ Service failed to start${NC}"
    echo -e "${YELLOW}Check logs: sudo journalctl -u dokpod${NC}"
fi

EOF

chmod +x start-dokpod.sh
```

### Create Monitoring Script
```bash
# Create monitoring and maintenance script
cat > maintain-dokpod.sh << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}Dokpod Maintenance Tool${NC}\n"
    echo -e "Usage: ./maintain-dokpod.sh [COMMAND]\n"
    echo -e "Commands:"
    echo -e "  ${GREEN}status${NC}      Check application status"
    echo -e "  ${GREEN}logs${NC}        View application logs"
    echo -e "  ${GREEN}restart${NC}     Restart application"
    echo -e "  ${GREEN}backup${NC}      Create backup"
    echo -e "  ${GREEN}health${NC}      Check health endpoints"
    echo -e "  ${GREEN}update${NC}      Update from GitHub"
    echo -e "  ${GREEN}monitor${NC}     Start real-time monitoring"
}

check_status() {
    echo -e "${BLUE}📊 Application Status${NC}"
    sudo systemctl status dokpod --no-pager
    
    if systemctl is-active --quiet dokpod; then
        echo -e "\n${GREEN}✅ Service is running${NC}"
    else
        echo -e "\n${RED}❌ Service is not running${NC}"
    fi
}

view_logs() {
    echo -e "${BLUE}📋 Application Logs (Press Ctrl+C to exit)${NC}"
    sudo journalctl -u dokpod -f
}

restart_app() {
    echo -e "${BLUE}🔄 Restarting Dokpod...${NC}"
    sudo systemctl restart dokpod
    sleep 3
    check_status
}

create_backup() {
    echo -e "${BLUE}💾 Creating Backup...${NC}"
    
    BACKUP_DIR="$HOME/dokpod-backups"
    mkdir -p $BACKUP_DIR
    
    DATE=$(date +%Y%m%d_%H%M%S)
    
    # Database backup
    pg_dump -h localhost -U dokpod_user -d dokpod_production > "$BACKUP_DIR/db_backup_$DATE.sql"
    
    # Application backup
    tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" -C $HOME --exclude=node_modules --exclude=.git dokpod
    
    echo -e "${GREEN}✅ Backup created in $BACKUP_DIR${NC}"
    ls -la $BACKUP_DIR/
}

check_health() {
    echo -e "${BLUE}⚕️  Health Check${NC}"
    
    DOMAIN=$(grep NEXTAUTH_URL dokpod/apps/dokploy/.env | cut -d'=' -f2 | sed 's|https://||')
    
    echo -e "\nTesting endpoints:"
    
    # Test health endpoint
    if curl -s -f https://$DOMAIN/api/health > /dev/null; then
        echo -e "• Health endpoint: ${GREEN}✅ OK${NC}"
    else
        echo -e "• Health endpoint: ${RED}❌ Failed${NC}"
    fi
    
    # Test status endpoint
    if curl -s -f https://$DOMAIN/api/status > /dev/null; then
        echo -e "• Status endpoint: ${GREEN}✅ OK${NC}"
    else
        echo -e "• Status endpoint: ${RED}❌ Failed${NC}"
    fi
    
    # Full health check
    echo -e "\n${BLUE}Detailed Health Check:${NC}"
    curl -s https://$DOMAIN/api/health | jq . 2>/dev/null || curl -s https://$DOMAIN/api/health
}

update_app() {
    echo -e "${BLUE}🔄 Updating from GitHub...${NC}"
    
    cd dokpod
    
    # Stop service
    sudo systemctl stop dokpod
    
    # Pull latest changes
    git pull origin main
    
    # Install dependencies
    pnpm install
    
    # Build application
    pnpm build
    
    # Run migrations
    cd apps/dokploy
    pnpm run db:migrate
    cd ../..
    
    # Start service
    sudo systemctl start dokpod
    
    echo -e "${GREEN}✅ Update completed${NC}"
    sleep 3
    check_status
}

start_monitoring() {
    echo -e "${BLUE}📊 Starting Real-time Monitoring (Press Ctrl+C to exit)${NC}\n"
    
    while true; do
        clear
        echo -e "${BLUE}=== Dokpod Monitoring Dashboard ===${NC}"
        echo -e "$(date)"
        echo
        
        # Service status
        if systemctl is-active --quiet dokpod; then
            echo -e "Service Status: ${GREEN}✅ Running${NC}"
        else
            echo -e "Service Status: ${RED}❌ Stopped${NC}"
        fi
        
        # System resources
        echo -e "\n${BLUE}System Resources:${NC}"
        echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "Memory: $(free -h | awk 'NR==2{printf "%s/%s (%.1f%%)", $3,$2,$3*100/$2}')"
        echo "Disk: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3,$2,$5}')"
        
        # Recent logs
        echo -e "\n${BLUE}Recent Logs:${NC}"
        sudo journalctl -u dokpod --since "1 minute ago" --no-pager -n 5
        
        sleep 30
    done
}

case $1 in
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    restart)
        restart_app
        ;;
    backup)
        create_backup
        ;;
    health)
        check_health
        ;;
    update)
        update_app
        ;;
    monitor)
        start_monitoring
        ;;
    *)
        show_help
        ;;
esac

EOF

chmod +x maintain-dokpod.sh
```

## 📝 Complete Installation Process

আপনার সার্ভারে SSH করার পর এই commands গুলো run করুন:

```bash
# 1. Create installation directory and scripts
mkdir -p ~/dokpod-install
cd ~/dokpod-install

# 2. Download and run the installation scripts (copy the above scripts first)

# 3. Run installation
./install-dokpod.sh

# 4. Configure your application
./configure-dokpod.sh

# 5. Start the application
./start-dokpod.sh

# 6. Maintain and monitor
./maintain-dokpod.sh status
```

এই guide এবং scripts দিয়ে আপনি আপনার customized Dokpod সফলভাবে live server এ install এবং maintain করতে পারবেন!

আপনার যদি কোন specific step এ সমস্যা হয়, আমাকে জানান। আমি আপনাকে troubleshoot করতে সাহায্য করব! 🚀