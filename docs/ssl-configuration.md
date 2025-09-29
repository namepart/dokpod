# SSL Configuration Guide for Dokpod Production

## Overview
This guide helps you configure SSL/TLS certificates for your Dokpod production deployment using Traefik's automatic SSL management.

## Automatic SSL with Let's Encrypt (Recommended)

### 1. Domain Prerequisites
- Your domain must point to your server's IP address
- Ports 80 and 443 must be accessible from the internet
- DNS propagation must be complete

### 2. Environment Configuration
Add these variables to your `.env` file:

```env
# Required for automatic SSL
TRAEFIK_ACME_EMAIL=your-email@domain.com
NEXTAUTH_URL=https://your-domain.com

# Optional SSL settings
TRAEFIK_SSL_PROVIDER=letsencrypt
```

### 3. Domain Verification Script
Create this script to verify your domain setup:

```bash
#!/bin/bash
# verify-domain.sh

DOMAIN="your-domain.com"
SERVER_IP="your-server-ip"

echo "🔍 Verifying domain configuration for: $DOMAIN"
echo "Expected server IP: $SERVER_IP"

# Check DNS resolution
RESOLVED_IP=$(dig +short $DOMAIN)
echo "Resolved IP: $RESOLVED_IP"

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS resolution correct"
else
    echo "❌ DNS resolution incorrect. Update your domain's A record."
    exit 1
fi

# Check if ports are accessible
if nc -z $DOMAIN 80; then
    echo "✅ Port 80 accessible"
else
    echo "❌ Port 80 not accessible"
fi

if nc -z $DOMAIN 443; then
    echo "✅ Port 443 accessible"  
else
    echo "⚠️ Port 443 not accessible (expected before SSL setup)"
fi

echo "🎯 Domain verification complete"
```

## SSL Validation

The application includes built-in SSL configuration validation. Run this in your application:

```typescript
import { validateSSLConfig, getConfigSummary } from '@/lib/config-helpers';

// Check SSL configuration
const sslValidation = validateSSLConfig();
console.log('SSL Configuration:', sslValidation);

// Get complete configuration summary
const summary = getConfigSummary();
console.log('Production Ready:', summary.overall.readyForProduction);
```

## Traefik Configuration

### 1. Default Configuration
Dokploy comes with Traefik pre-configured for automatic SSL. The default configuration:

- Uses Let's Encrypt for certificate generation
- Automatically handles HTTP to HTTPS redirects
- Stores certificates in Docker volumes
- Handles certificate renewals automatically

### 2. Custom SSL Certificates
If you need to use custom SSL certificates instead of Let's Encrypt:

```yaml
# In your docker-compose.yml or Traefik configuration
labels:
  - "traefik.http.routers.app.tls=true"
  - "traefik.http.routers.app.tls.certresolver=custom"
```

### 3. SSL Configuration Health Check
Add this endpoint to monitor SSL status:

```typescript
// Add to your health monitoring
export async function checkSSLStatus(domain: string) {
  try {
    const response = await fetch(`https://${domain}/health`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    return {
      status: 'healthy',
      certificate: 'valid',
      redirect: response.url.startsWith('https://') ? 'working' : 'not_configured'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}
```

## Common SSL Issues & Solutions

### Issue 1: Certificate Generation Fails
**Symptoms:** SSL certificates not generated, 502 errors
**Solutions:**
1. Verify domain DNS points to correct IP
2. Ensure ports 80/443 are open
3. Check TRAEFIK_ACME_EMAIL is set
4. Wait for DNS propagation (up to 24 hours)

### Issue 2: Mixed Content Errors
**Symptoms:** Page loads but resources fail over HTTPS
**Solutions:**
1. Update NEXTAUTH_URL to use https://
2. Configure proxy headers correctly
3. Update any hardcoded HTTP URLs

### Issue 3: Certificate Renewal Issues
**Symptoms:** Certificates expire, SSL errors after 3 months
**Solutions:**
1. Check Traefik has write access to certificate storage
2. Verify domain is still pointing to server
3. Check firewall allows Let's Encrypt validation

## SSL Monitoring

### 1. Certificate Expiry Monitoring
```bash
#!/bin/bash
# check-ssl-expiry.sh

DOMAIN="your-domain.com"
THRESHOLD_DAYS=30

EXPIRY_DATE=$(openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | \
  openssl x509 -noout -dates | grep notAfter | cut -d= -f2)

EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $THRESHOLD_DAYS ]; then
    echo "⚠️ SSL certificate expires in $DAYS_LEFT days"
    # Send alert notification
else
    echo "✅ SSL certificate valid for $DAYS_LEFT days"
fi
```

### 2. Integration with Health Monitoring
Add SSL checks to your existing health monitoring system:

```typescript
// In apps/dokploy/lib/health-monitoring.ts
import { checkSSLStatus } from './ssl-helpers';

export async function performHealthCheck() {
  const checks = {
    // ... existing checks
    ssl: await checkSSLStatus(process.env.NEXTAUTH_URL?.replace('https://', '') || 'localhost')
  };
  
  return checks;
}
```

## Deployment Checklist

Before enabling SSL in production:

- [ ] Domain DNS points to server IP
- [ ] Ports 80 and 443 are accessible
- [ ] TRAEFIK_ACME_EMAIL is configured
- [ ] NEXTAUTH_URL uses https://
- [ ] Domain verification script passes
- [ ] SSL validation returns no errors

## Security Best Practices

1. **HSTS Headers**: Traefik automatically adds HSTS headers for HTTPS routes
2. **Certificate Storage**: Ensure certificate volumes are backed up
3. **Monitoring**: Set up certificate expiry alerts
4. **Fallback**: Have a plan for manual certificate installation if needed

## Testing SSL Configuration

1. **Manual Testing:**
   ```bash
   curl -I https://your-domain.com/health
   ```

2. **Automated Testing:**
   ```bash
   # Test SSL grade
   curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com&all=done"
   ```

3. **Application Testing:**
   Use the built-in configuration validation to ensure everything is properly configured.

Remember: SSL configuration is critical for production security. Test thoroughly in a staging environment before deploying to production.