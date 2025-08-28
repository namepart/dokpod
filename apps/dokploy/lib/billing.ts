// Local billing service for Dokploy
export interface BillingProvider {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface BillingPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  provider: string;
}

export interface WebhookData {
  provider: string;
  eventType: string;
  data: any;
}

class BillingService {
  async processWebhook(data: WebhookData): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Processing ${data.provider} webhook:`, data.eventType);
      
      switch (data.provider) {
        case 'whmcs':
          return this.processWHMCSWebhook(data);
        case 'stripe':
          return this.processStripeWebhook(data);
        case 'paypal':
          return this.processPayPalWebhook(data);
        default:
          return { success: false, message: 'Unknown provider' };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, message: 'Processing failed' };
    }
  }

  private async processWHMCSWebhook(data: WebhookData) {
    return { success: true, message: 'WHMCS webhook processed' };
  }

  private async processStripeWebhook(data: WebhookData) {
    return { success: true, message: 'Stripe webhook processed' };
  }

  private async processPayPalWebhook(data: WebhookData) {
    return { success: true, message: 'PayPal webhook processed' };
  }

  async createPackage(packageData: Omit<BillingPackage, 'id'>): Promise<BillingPackage> {
    const newPackage: BillingPackage = {
      id: pkg_,
      ...packageData,
    };
    
    console.log('Creating package:', newPackage);
    return newPackage;
  }

  async getBillingProviders(): Promise<BillingProvider[]> {
    return [
      {
        id: 'whmcs',
        name: 'WHMCS',
        enabled: process.env.WHMCS_ENABLED === 'true',
        config: {
          url: process.env.WHMCS_URL,
          identifier: process.env.WHMCS_IDENTIFIER,
        },
      },
      {
        id: 'stripe',
        name: 'Stripe',
        enabled: process.env.STRIPE_ENABLED === 'true',
        config: {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        },
      },
      {
        id: 'paypal',
        name: 'PayPal',
        enabled: process.env.PAYPAL_ENABLED === 'true',
        config: {
          clientId: process.env.PAYPAL_CLIENT_ID,
          mode: process.env.PAYPAL_MODE,
        },
      },
    ];
  }

  async getPackages(): Promise<BillingPackage[]> {
    return [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        currency: 'USD',
        features: ['5 Projects', '10GB Storage', 'Basic Support'],
        provider: 'stripe',
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 29.99,
        currency: 'USD',
        features: ['Unlimited Projects', '100GB Storage', 'Priority Support'],
        provider: 'stripe',
      },
    ];
  }
}

export const billingService = new BillingService();
