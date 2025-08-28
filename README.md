# 🚀 Dokpod - Complete Billing System Integration

A comprehensive billing and subscription management system built on top of Dokploy with full resource control capabilities.

## ✨ Features

### 💳 Billing Integration
- **WHMCS Integration** - Complete WHMCS API support
- **Stripe Integration** - Full Stripe payment processing
- **PayPal Integration** - PayPal webhook handling
- **Webhook Management** - Real-time payment notifications

### 📦 Package Management
- **Resource Control** - Memory, CPU, storage limits
- **Multi-tier Packages** - Basic, Pro, Enterprise plans
- **User Limits** - Projects, applications, databases, domains, users
- **Feature Control** - Backups, monitoring, SSL, custom domains

### 🗄️ Database Schema
- **billing_provider** - Payment provider configurations
- **billing_package** - Subscription packages with limits
- **user_subscription** - User billing subscriptions
- **billing_transaction** - Payment transaction logs
- **billing_webhook** - Webhook processing logs

## 📋 Package Tiers

### Basic Plan - $9.99/month
- 5 Projects
- 10 Applications
- 3 Databases
- 5 Domains
- 2 Users
- Features: Backups, Monitoring, SSL

### Pro Plan - $29.99/month
- 20 Projects
- 50 Applications
- 10 Databases
- 20 Domains
- 5 Users
- Features: + Custom Domains, API Access, Priority Support

### Enterprise Plan - $99.99/month
- Unlimited Projects
- Unlimited Applications
- Unlimited Databases
- Unlimited Domains
- Unlimited Users
- Features: + White Label

## 🛠️ Installation

### Prerequisites
- Node.js 20.16.0+
- PostgreSQL database
- Git

### Setup

1. **Clone Repository**
```bash
git clone https://github.com/namepart/dokpod.git
cd dokpod
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Database Migration**
```bash
# Run the billing system migration
psql -d your_database -f apps/dokploy/drizzle/0107_billing_system.sql
```

4. **Environment Configuration**
```bash
cp apps/dokploy/.env.example apps/dokploy/.env
# Configure your billing provider settings
```

5. **Start Development**
```bash
pnpm dev
```

## ⚙️ Configuration

### Environment Variables

```env
# WHMCS Configuration
WHMCS_ENABLED=true
WHMCS_URL=https://your-whmcs.com
WHMCS_IDENTIFIER=your_api_identifier
WHMCS_SECRET=your_api_secret

# Stripe Configuration
STRIPE_ENABLED=true
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_ENABLED=true
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox
```

## 🎯 API Endpoints

### Billing Providers
- `GET /api/trpc/billing.getBillingProviders` - Get all providers
- `POST /api/trpc/billing.createBillingProvider` - Create provider
- `PUT /api/trpc/billing.updateBillingProvider` - Update provider

### Packages
- `GET /api/trpc/billing.getPackages` - Get all packages
- `POST /api/trpc/billing.createPackage` - Create package
- `PUT /api/trpc/billing.updatePackage` - Update package

### Webhooks
- `POST /api/billing/webhooks/whmcs` - WHMCS webhook
- `POST /api/billing/webhooks/stripe` - Stripe webhook
- `POST /api/billing/webhooks/paypal` - PayPal webhook

## 🎨 UI Components

### Admin Panels
- **Billing Admin Panel** - Provider management
- **Package Management** - Resource limit configuration
- **Billing Overview** - Dashboard and analytics

### User Interface
- **Billing Settings** - User billing configuration
- **Package Selection** - Subscription management
- **Payment History** - Transaction logs

## 📊 Database Schema

### Resource Control Fields
```sql
-- Package Resource Limits
memory_limit INTEGER,        -- RAM in MB
cpu_limit INTEGER,          -- CPU units
max_projects INTEGER,       -- Project limit
max_applications INTEGER,   -- Application limit
max_databases INTEGER,      -- Database limit
max_domains INTEGER,        -- Domain limit
max_users INTEGER,          -- User limit
storage_limit INTEGER,      -- Storage in GB
```

## 🔧 Development

### Build
```bash
pnpm build
```

### Type Check
```bash
pnpm typecheck
```

### Database Migration
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## 🏷️ Releases

- **v1.0-billing-system** - Complete billing integration with resource control

## 📄 License

MIT License - see LICENSE.md for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/billing-enhancement`)
3. Commit changes (`git commit -am 'Add new billing feature'`)
4. Push to branch (`git push origin feature/billing-enhancement`)
5. Create Pull Request

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues

---

**Built with ❤️ using Dokploy + Complete Billing System Integration**
