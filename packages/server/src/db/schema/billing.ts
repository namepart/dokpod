import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  primaryKey
} from "drizzle-orm/pg-core";
import { generateId } from "../utils";

// Billing Provider Types
export const billingProviderEnum = pgEnum("billing_provider", [
  "whmcs",
  "stripe", 
  "paypal"
]);

// Billing Package Cycle Types
export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "yearly", 
  "one-time"
]);

// Billing Provider Status
export const billingStatusEnum = pgEnum("billing_status", [
  "active",
  "inactive",
  "pending",
  "suspended"
]);

// Billing Providers Table
export const billingProviders = pgTable("billing_provider", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  type: billingProviderEnum("type").notNull(),
  webhookUrl: text("webhook_url"),
  config: json("config").$type<{
    apiUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    additionalSettings?: Record<string, any>;
  }>(),
  isActive: boolean("is_active").default(false).notNull(),
  webhookEvents: json("webhook_events").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Billing Packages Table
export const billingPackages = pgTable("billing_package", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  billingCycle: billingCycleEnum("billing_cycle").default("monthly").notNull(),
  
  // Resource Limits
  memoryLimit: integer("memory_limit"), // in MB
  cpuLimit: integer("cpu_limit"), // in CPU units
  maxProjects: integer("max_projects").default(1),
  maxApplications: integer("max_applications").default(5),
  maxDatabases: integer("max_databases").default(2),
  maxDomains: integer("max_domains").default(3),
  maxUsers: integer("max_users").default(1),
  storageLimit: integer("storage_limit"), // in GB
  
  // Features
  features: json("features").$type<{
    backups?: boolean;
    monitoring?: boolean;
    ssl?: boolean;
    customDomains?: boolean;
    apiAccess?: boolean;
    prioritySupport?: boolean;
    whiteLabel?: boolean;
  }>(),
  
  // Provider specific configuration
  providerId: text("provider_id").references(() => billingProviders.id),
  externalId: varchar("external_id", { length: 255 }), // Provider package ID
  
  // Status and ordering
  isActive: boolean("is_active").default(true).notNull(),
  isPopular: boolean("is_popular").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// User Subscriptions Table
export const userSubscriptions = pgTable("user_subscription", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text("user_id").notNull(), // References user table
  packageId: text("package_id")
    .notNull()
    .references(() => billingPackages.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => billingProviders.id),
  
  // Subscription details
  externalSubscriptionId: varchar("external_subscription_id", { length: 255 }),
  status: billingStatusEnum("status").default("pending").notNull(),
  
  // Billing cycle details
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  nextBillingDate: timestamp("next_billing_date", { withTimezone: true }),
  
  // Pricing details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Billing Transactions Table
export const billingTransactions = pgTable("billing_transaction", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId()),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => userSubscriptions.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => billingProviders.id),
  
  // Transaction details
  externalTransactionId: varchar("external_transaction_id", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // payment, refund, credit, etc.
  status: varchar("status", { length: 50 }).notNull(), // pending, completed, failed
  
  // Amount details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Webhook data
  webhookData: json("webhook_data").$type<Record<string, any>>(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Billing Webhooks Log Table
export const billingWebhooks = pgTable("billing_webhook", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateId()),
  providerId: text("provider_id")
    .notNull()
    .references(() => billingProviders.id),
  
  // Webhook details
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventId: varchar("event_id", { length: 255 }),
  
  // Request data
  payload: json("payload").notNull(),
  headers: json("headers"),
  
  // Processing details
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const billingProvidersRelations = relations(billingProviders, ({ many }) => ({
  packages: many(billingPackages),
  subscriptions: many(userSubscriptions),
  transactions: many(billingTransactions),
  webhooks: many(billingWebhooks),
}));

export const billingPackagesRelations = relations(billingPackages, ({ one, many }) => ({
  provider: one(billingProviders, {
    fields: [billingPackages.providerId],
    references: [billingProviders.id],
  }),
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  package: one(billingPackages, {
    fields: [userSubscriptions.packageId],
    references: [billingPackages.id],
  }),
  provider: one(billingProviders, {
    fields: [userSubscriptions.providerId],
    references: [billingProviders.id],
  }),
  transactions: many(billingTransactions),
}));

export const billingTransactionsRelations = relations(billingTransactions, ({ one }) => ({
  subscription: one(userSubscriptions, {
    fields: [billingTransactions.subscriptionId],
    references: [userSubscriptions.id],
  }),
  provider: one(billingProviders, {
    fields: [billingTransactions.providerId],
    references: [billingProviders.id],
  }),
}));

export const billingWebhooksRelations = relations(billingWebhooks, ({ one }) => ({
  provider: one(billingProviders, {
    fields: [billingWebhooks.providerId],
    references: [billingProviders.id],
  }),
}));

// Types
export type BillingProvider = typeof billingProviders.$inferSelect;
export type NewBillingProvider = typeof billingProviders.$inferInsert;
export type BillingPackage = typeof billingPackages.$inferSelect;
export type NewBillingPackage = typeof billingPackages.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type BillingTransaction = typeof billingTransactions.$inferSelect;
export type NewBillingTransaction = typeof billingTransactions.$inferInsert;
export type BillingWebhook = typeof billingWebhooks.$inferSelect;
export type NewBillingWebhook = typeof billingWebhooks.$inferInsert;
