-- Migration: Add Billing System Tables
-- Date: 2025-08-28
-- Description: Creates billing providers, packages, subscriptions, and related tables

-- Create enums
DO $$ BEGIN
  CREATE TYPE "billing_provider" AS ENUM('whmcs', 'stripe', 'paypal');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "billing_cycle" AS ENUM('monthly', 'yearly', 'one-time');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "billing_status" AS ENUM('active', 'inactive', 'pending', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create billing_provider table
CREATE TABLE IF NOT EXISTS "billing_provider" (
"id" text PRIMARY KEY NOT NULL,
"name" varchar(255) NOT NULL,
"display_name" varchar(255) NOT NULL,
"type" "billing_provider" NOT NULL,
"webhook_url" text,
"config" json,
"is_active" boolean DEFAULT false NOT NULL,
"webhook_events" json,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create billing_package table
CREATE TABLE IF NOT EXISTS "billing_package" (
"id" text PRIMARY KEY NOT NULL,
"name" varchar(255) NOT NULL,
"description" text,
"price" numeric(10,2) NOT NULL,
"currency" varchar(3) DEFAULT 'USD' NOT NULL,
"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
"memory_limit" integer,
"cpu_limit" integer,
"max_projects" integer DEFAULT 1,
"max_applications" integer DEFAULT 5,
"max_databases" integer DEFAULT 2,
"max_domains" integer DEFAULT 3,
"max_users" integer DEFAULT 1,
"storage_limit" integer,
"features" json,
"provider_id" text,
"external_id" varchar(255),
"is_active" boolean DEFAULT true NOT NULL,
"is_popular" boolean DEFAULT false NOT NULL,
"sort_order" integer DEFAULT 0,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create user_subscription table
CREATE TABLE IF NOT EXISTS "user_subscription" (
"id" text PRIMARY KEY NOT NULL,
"user_id" text NOT NULL,
"package_id" text NOT NULL,
"provider_id" text NOT NULL,
"external_subscription_id" varchar(255),
"status" "billing_status" DEFAULT 'pending' NOT NULL,
"current_period_start" timestamp with time zone,
"current_period_end" timestamp with time zone,
"next_billing_date" timestamp with time zone,
"amount" numeric(10,2) NOT NULL,
"currency" varchar(3) DEFAULT 'USD' NOT NULL,
"metadata" json,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create billing_transaction table
CREATE TABLE IF NOT EXISTS "billing_transaction" (
"id" text PRIMARY KEY NOT NULL,
"subscription_id" text NOT NULL,
"provider_id" text NOT NULL,
"external_transaction_id" varchar(255),
"type" varchar(50) NOT NULL,
"status" varchar(50) NOT NULL,
"amount" numeric(10,2) NOT NULL,
"currency" varchar(3) DEFAULT 'USD' NOT NULL,
"webhook_data" json,
"processed_at" timestamp with time zone,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create billing_webhook table
CREATE TABLE IF NOT EXISTS "billing_webhook" (
"id" text PRIMARY KEY NOT NULL,
"provider_id" text NOT NULL,
"event_type" varchar(100) NOT NULL,
"event_id" varchar(255),
"payload" json NOT NULL,
"headers" json,
"status" varchar(50) DEFAULT 'pending' NOT NULL,
"processed_at" timestamp with time zone,
"error_message" text,
"retry_count" integer DEFAULT 0,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
ALTER TABLE "billing_package" ADD CONSTRAINT "billing_package_provider_id_billing_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "billing_provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_package_id_billing_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "billing_package"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_provider_id_billing_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "billing_provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "billing_transaction" ADD CONSTRAINT "billing_transaction_subscription_id_user_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "user_subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "billing_transaction" ADD CONSTRAINT "billing_transaction_provider_id_billing_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "billing_provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "billing_webhook" ADD CONSTRAINT "billing_webhook_provider_id_billing_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "billing_provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

-- Insert default billing providers
INSERT INTO "billing_provider" (
"id", "name", "display_name", "type", "is_active", "created_at", "updated_at"
) VALUES 
('whmcs-provider', 'whmcs', 'WHMCS', 'whmcs', false, now(), now()),
('stripe-provider', 'stripe', 'Stripe', 'stripe', false, now(), now()),
('paypal-provider', 'paypal', 'PayPal', 'paypal', false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert default packages
INSERT INTO "billing_package" (
"id", "name", "description", "price", "currency", "billing_cycle",
"max_projects", "max_applications", "max_databases", "max_domains", "max_users",
"features", "provider_id", "is_active", "sort_order",
"created_at", "updated_at"
) VALUES 
('basic-plan', 'Basic Plan', 'Perfect for small projects', 9.99, 'USD', 'monthly',
 5, 10, 3, 5, 2,
 '{"backups": true, "monitoring": true, "ssl": true, "customDomains": false, "apiAccess": false, "prioritySupport": false, "whiteLabel": false}',
 'stripe-provider', true, 1, now(), now()),
('pro-plan', 'Pro Plan', 'Great for growing businesses', 29.99, 'USD', 'monthly',
 20, 50, 10, 20, 5,
 '{"backups": true, "monitoring": true, "ssl": true, "customDomains": true, "apiAccess": true, "prioritySupport": true, "whiteLabel": false}',
 'stripe-provider', true, 2, now(), now()),
('enterprise-plan', 'Enterprise Plan', 'For large organizations', 99.99, 'USD', 'monthly',
 -1, -1, -1, -1, -1,
 '{"backups": true, "monitoring": true, "ssl": true, "customDomains": true, "apiAccess": true, "prioritySupport": true, "whiteLabel": true}',
 'stripe-provider', true, 3, now(), now())
ON CONFLICT (id) DO NOTHING;
