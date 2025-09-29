import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import {
	checkQuota,
	createBillingProvider,
	createPackage,
	createSubscription,
	getActiveBillingProvider,
	getBillingProviders,
	getPackageById,
	getPackages,
	getSubscriptionByOrganization,
	recordUsage,
	updateBillingProvider,
	updatePackage,
	updateSubscriptionStatus,
} from "../../../lib/billing";
import { getConfigSummary } from "../../../lib/config-helpers";
import {
	testBillingTableOperations,
	validateBillingDatabase,
} from "../../../lib/database-validation";
import {
	getEnvironmentSummary,
	validateBillingEnvironment,
} from "../../../lib/environment-validation";
import {
	getSystemStatus,
	performHealthCheck,
} from "../../../lib/health-monitoring";

// Validation schemas
const packageSchema = z.object({
	name: z.string().min(1, "Package name is required"),
	description: z.string().optional(),
	price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
	currency: z.string().length(3, "Currency must be 3 characters"),
	billingCycle: z.enum(["monthly", "yearly", "one-time"]).default("monthly"),
	cpuLimit: z.number().int().min(0).optional(),
	memoryLimit: z.number().int().min(0).optional(),
	storageLimit: z.number().int().min(0).optional(),
	bandwidthLimit: z.number().int().min(0).optional(),
	maxProjects: z.number().int().min(1).default(5),
	maxApplications: z.number().int().min(1).default(10),
	maxDatabases: z.number().int().min(1).default(5),
	maxDomains: z.number().int().min(1).default(10),
	maxUsers: z.number().int().min(1).default(1),
	features: z
		.object({
			multiNode: z.boolean().default(false),
			customDomains: z.boolean().default(true),
			sslCertificates: z.boolean().default(true),
			backups: z.boolean().default(true),
			monitoring: z.boolean().default(true),
			apiAccess: z.boolean().default(false),
			prioritySupport: z.boolean().default(false),
			whiteLabel: z.boolean().default(false),
		})
		.default({}),
	isActive: z.boolean().default(true),
	isPublic: z.boolean().default(true),
	sortOrder: z.number().int().default(0),
});

const billingProviderSchema = z.object({
	name: z.string().min(1, "Provider name is required"),
	displayName: z.string().min(1, "Display name is required"),
	isActive: z.boolean().default(false),
	config: z
		.object({
			apiUrl: z.string().url().optional(),
			apiKey: z.string().optional(),
			apiSecret: z.string().optional(),
			webhookSecret: z.string().optional(),
			additionalSettings: z.record(z.string(), z.any()).optional(),
		})
		.default({}),
	webhookUrl: z.string().optional(),
	webhookEvents: z.array(z.string()).default([]),
});

const subscriptionSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required"),
	packageId: z.string().min(1, "Package ID is required"),
	billingProviderId: z.string().optional(),
});

const usageSchema = z.object({
	subscriptionId: z.string().min(1, "Subscription ID is required"),
	metricType: z.string().min(1, "Metric type is required"),
	value: z.number().min(0, "Value must be positive"),
	unit: z.string().min(1, "Unit is required"),
	metadata: z.record(z.string(), z.any()).default({}),
});

const quotaSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required"),
	resourceType: z.enum([
		"projects",
		"applications",
		"databases",
		"domains",
		"users",
	]),
});

export const billingRouter = createTRPCRouter({
	// Package Management
	createPackage: adminProcedure
		.input(packageSchema)
		.mutation(async ({ input }) => {
			try {
				return await createPackage(input);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to create package",
					cause: error,
				});
			}
		}),

	getPackages: protectedProcedure
		.input(z.object({ includeInactive: z.boolean().default(false) }))
		.query(async ({ input }) => {
			try {
				return await getPackages(input.includeInactive);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch packages",
					cause: error,
				});
			}
		}),

	getPackage: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			try {
				const pkg = await getPackageById(input.id);
				if (!pkg) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Package not found",
					});
				}
				return pkg;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch package",
					cause: error,
				});
			}
		}),

	updatePackage: adminProcedure
		.input(z.object({ id: z.string() }).merge(packageSchema.partial()))
		.mutation(async ({ input }) => {
			try {
				const { id, ...updates } = input;
				return await updatePackage(id, updates);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to update package",
					cause: error,
				});
			}
		}),

	// Billing Provider Management
	createBillingProvider: adminProcedure
		.input(billingProviderSchema)
		.mutation(async ({ input }) => {
			try {
				return await createBillingProvider(input);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to create billing provider",
					cause: error,
				});
			}
		}),

	getBillingProviders: adminProcedure.query(async () => {
		try {
			return await getBillingProviders();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch billing providers",
				cause: error,
			});
		}
	}),

	getActiveBillingProvider: protectedProcedure.query(async () => {
		try {
			return await getActiveBillingProvider();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch active billing provider",
				cause: error,
			});
		}
	}),

	updateBillingProvider: adminProcedure
		.input(z.object({ id: z.string() }).merge(billingProviderSchema.partial()))
		.mutation(async ({ input }) => {
			try {
				const { id, ...updates } = input;
				return await updateBillingProvider(id, updates);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to update billing provider",
					cause: error,
				});
			}
		}),

	// Subscription Management
	createSubscription: protectedProcedure
		.input(subscriptionSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				// Ensure user can create subscription for the organization
				if (input.organizationId !== ctx.session.activeOrganizationId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message:
							"You are not authorized to create subscriptions for this organization",
					});
				}

				return await createSubscription(
					input.organizationId,
					input.packageId,
					input.billingProviderId,
				);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to create subscription",
					cause: error,
				});
			}
		}),

	getSubscription: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await getSubscriptionByOrganization(
				ctx.session.activeOrganizationId,
			);
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch subscription",
				cause: error,
			});
		}
	}),

	updateSubscriptionStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum([
					"pending",
					"active",
					"past_due",
					"cancelled",
					"unpaid",
				]),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				return await updateSubscriptionStatus(input.id, input.status);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to update subscription status",
					cause: error,
				});
			}
		}),

	// Usage Tracking
	recordUsage: protectedProcedure
		.input(usageSchema)
		.mutation(async ({ input }) => {
			try {
				await recordUsage(
					input.subscriptionId,
					input.metricType,
					input.value,
					input.unit,
					input.metadata,
				);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to record usage",
					cause: error,
				});
			}
		}),

	// Quota Checking
	checkQuota: protectedProcedure
		.input(quotaSchema)
		.query(async ({ input, ctx }) => {
			try {
				// Ensure user can check quota for the organization
				if (input.organizationId !== ctx.session.activeOrganizationId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message:
							"You are not authorized to check quota for this organization",
					});
				}

				return await checkQuota(input.organizationId, input.resourceType);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check quota",
					cause: error,
				});
			}
		}),

	// Current organization quota check (convenience method)
	checkCurrentQuota: protectedProcedure
		.input(
			z.object({
				resourceType: z.enum([
					"projects",
					"applications",
					"databases",
					"domains",
					"users",
				]),
			}),
		)
		.query(async ({ input, ctx }) => {
			try {
				return await checkQuota(
					ctx.session.activeOrganizationId,
					input.resourceType,
				);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check quota",
					cause: error,
				});
			}
		}),

	// Environment Validation
	validateEnvironment: adminProcedure.query(async () => {
		try {
			return validateBillingEnvironment();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to validate environment",
				cause: error,
			});
		}
	}),

	getEnvironmentSummary: adminProcedure.query(async () => {
		try {
			return getEnvironmentSummary();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get environment summary",
				cause: error,
			});
		}
	}),

	// Database Validation
	validateDatabase: adminProcedure.query(async () => {
		try {
			return await validateBillingDatabase();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to validate database",
				cause: error,
			});
		}
	}),

	testDatabaseOperations: adminProcedure.query(async () => {
		try {
			return await testBillingTableOperations();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to test database operations",
				cause: error,
			});
		}
	}),

	// Health Monitoring
	healthCheck: adminProcedure.query(async () => {
		try {
			return await performHealthCheck();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to perform health check",
				cause: error,
			});
		}
	}),

	systemStatus: adminProcedure.query(async () => {
		try {
			return await getSystemStatus();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get system status",
				cause: error,
			});
		}
	}),

	// Configuration Validation
	validateConfig: adminProcedure.query(async () => {
		try {
			return getConfigSummary();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to validate configuration",
				cause: error,
			});
		}
	}),
});
