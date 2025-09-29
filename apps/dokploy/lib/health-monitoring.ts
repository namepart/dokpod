// Health monitoring and system status checks

import { validateBillingDatabase } from "./database-validation";
import { validateBillingEnvironment } from "./environment-validation";

export interface HealthCheck {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	uptime: number;
	environment: {
		nodeVersion: string;
		nodeEnv: string;
		buildMode: string;
	};
	services: {
		database: {
			status: "up" | "down" | "error";
			responseTime?: number;
			error?: string;
		};
		billing: {
			status: "configured" | "partial" | "missing";
			enabledProviders: number;
			configuredProviders: number;
			errors: string[];
		};
	};
	metrics: {
		memoryUsage: {
			used: number;
			total: number;
			percentage: number;
		};
		timestamp: string;
	};
}

export async function performHealthCheck(): Promise<HealthCheck> {
	const startTime = Date.now();

	// Environment info
	const memoryUsage = process.memoryUsage();
	const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
	const usedMemory = memoryUsage.heapUsed;

	let overallStatus: HealthCheck["status"] = "healthy";
	const errors: string[] = [];

	// Database health check
	let dbStatus: HealthCheck["services"]["database"]["status"] = "up";
	let dbResponseTime: number | undefined;
	let dbError: string | undefined;

	try {
		const dbCheckStart = Date.now();
		const dbValidation = await validateBillingDatabase();
		dbResponseTime = Date.now() - dbCheckStart;

		if (!dbValidation.connected) {
			dbStatus = "down";
			dbError = "Database not connected";
			overallStatus = "unhealthy";
			errors.push("Database connection failed");
			console.error("[Health Check] Database connection failed:", {
				timestamp: new Date().toISOString(),
				databaseUrl: process.env.DATABASE_URL ? "[CONFIGURED]" : "[MISSING]",
				responseTime: dbResponseTime,
			});
		} else if (dbValidation.errors.length > 0) {
			dbStatus = "error";
			dbError = dbValidation.errors.join(", ");
			overallStatus = "degraded";
			errors.push("Database has errors");
			console.error("[Health Check] Database validation errors:", {
				timestamp: new Date().toISOString(),
				errors: dbValidation.errors,
				responseTime: dbResponseTime,
			});
		}
	} catch (error) {
		dbStatus = "error";
		dbError = error instanceof Error ? error.message : "Unknown database error";
		overallStatus = "unhealthy";
		errors.push("Database check failed");
		console.error("[Health Check] Database check exception:", {
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			databaseUrl: process.env.DATABASE_URL ? "[CONFIGURED]" : "[MISSING]",
		});
	}

	// Billing system health check
	let billingStatus: HealthCheck["services"]["billing"]["status"] =
		"configured";
	let enabledProviders = 0;
	let configuredProviders = 0;
	const billingErrors: string[] = [];

	try {
		const envValidation = validateBillingEnvironment();

		const enabled = envValidation.providers.filter(
			(p) => p.enabled && p.configured,
		);
		const configured = envValidation.providers.filter((p) => p.configured);

		enabledProviders = enabled.length;
		configuredProviders = configured.length;

		if (enabledProviders === 0) {
			if (configuredProviders === 0) {
				billingStatus = "missing";
				errors.push("No billing providers configured");
				console.warn("[Health Check] No billing providers configured:", {
					timestamp: new Date().toISOString(),
					availableProviders: envValidation.providers.map((p) => p.provider),
				});
			} else {
				billingStatus = "partial";
				errors.push("Billing providers configured but not enabled");
				console.warn("[Health Check] Billing providers not enabled:", {
					timestamp: new Date().toISOString(),
					configuredProviders: configured.map((p) => p.provider),
					enabledProviders: enabled.map((p) => p.provider),
				});
			}
			if (overallStatus === "healthy") {
				overallStatus = "degraded";
			}
		}

		if (envValidation.errors.length > 0) {
			console.error("[Health Check] Billing environment errors:", {
				timestamp: new Date().toISOString(),
				errors: envValidation.errors,
				providers: envValidation.providers,
			});
		}

		billingErrors.push(...envValidation.errors);
	} catch (error) {
		billingStatus = "missing";
		billingErrors.push(
			error instanceof Error ? error.message : "Unknown billing error",
		);
		if (overallStatus === "healthy") {
			overallStatus = "degraded";
		}
		console.error("[Health Check] Billing validation exception:", {
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
	}

	return {
		status: overallStatus,
		timestamp: new Date().toISOString(),
		uptime: Math.floor(process.uptime()),
		environment: {
			nodeVersion: process.version,
			nodeEnv: process.env.NODE_ENV || "development",
			buildMode: process.env.BUILD_MODE || "unknown",
		},
		services: {
			database: {
				status: dbStatus,
				responseTime: dbResponseTime,
				error: dbError,
			},
			billing: {
				status: billingStatus,
				enabledProviders,
				configuredProviders,
				errors: billingErrors,
			},
		},
		metrics: {
			memoryUsage: {
				used: Math.round(usedMemory / 1024 / 1024), // MB
				total: Math.round(totalMemory / 1024 / 1024), // MB
				percentage: Math.round((usedMemory / totalMemory) * 100),
			},
			timestamp: new Date().toISOString(),
		},
	};
}

export interface SystemStatus {
	system: "dokpod";
	version: string;
	status: "operational" | "degraded" | "down";
	lastCheck: string;
	components: {
		name: string;
		status: "operational" | "degraded" | "down";
		description: string;
	}[];
}

export async function getSystemStatus(): Promise<SystemStatus> {
	const health = await performHealthCheck();

	const components = [
		{
			name: "Database",
			status:
				health.services.database.status === "up"
					? "operational"
					: health.services.database.status === "error"
						? "degraded"
						: "down",
			description:
				health.services.database.error || "Database operations normal",
		},
		{
			name: "Billing System",
			status:
				health.services.billing.status === "configured"
					? "operational"
					: health.services.billing.status === "partial"
						? "degraded"
						: "down",
			description:
				health.services.billing.enabledProviders > 0
					? `${health.services.billing.enabledProviders} providers enabled`
					: "No billing providers enabled",
		},
	];

	let systemStatus: SystemStatus["status"] = "operational";
	if (
		health.status === "degraded" ||
		components.some((c) => c.status === "degraded")
	) {
		systemStatus = "degraded";
	}
	if (
		health.status === "unhealthy" ||
		components.some((c) => c.status === "down")
	) {
		systemStatus = "down";
	}

	return {
		system: "dokpod",
		version: process.env.DOKPOD_VERSION || "1.0.0-billing",
		status: systemStatus,
		lastCheck: new Date().toISOString(),
		components: components as SystemStatus["components"],
	};
}
