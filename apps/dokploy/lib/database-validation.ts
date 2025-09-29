// Database connection and billing table validation

import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
	billingPackages,
	billingProviders,
	billingTransactions,
	billingWebhooks,
	userSubscriptions,
} from "@/server/db/schema";

// Simple retry helper for database operations
async function withRetry<T>(
	operation: () => Promise<T>,
	retries = 2,
	delay = 1000,
): Promise<T> {
	for (let attempt = 1; attempt <= retries + 1; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (attempt === retries + 1) {
				// Log final failure with context
				console.error("[DB Validation] Operation failed after retries:", {
					timestamp: new Date().toISOString(),
					attempts: attempt - 1,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
			// Log retry attempt
			console.warn(
				`[DB Validation] Attempt ${attempt} failed, retrying in ${delay}ms:`,
				{
					timestamp: new Date().toISOString(),
					error: error instanceof Error ? error.message : String(error),
				},
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
	throw new Error("Unexpected retry loop exit");
}

export interface DatabaseValidation {
	connected: boolean;
	tablesExist: {
		billingProviders: boolean;
		billingPackages: boolean;
		userSubscriptions: boolean;
		billingTransactions: boolean;
		billingWebhooks: boolean;
	};
	errors: string[];
	warnings: string[];
}

export async function validateBillingDatabase(): Promise<DatabaseValidation> {
	const result: DatabaseValidation = {
		connected: false,
		tablesExist: {
			billingProviders: false,
			billingPackages: false,
			userSubscriptions: false,
			billingTransactions: false,
			billingWebhooks: false,
		},
		errors: [],
		warnings: [],
	};

	try {
		// Test basic database connection with retry
		await withRetry(() => db.execute(sql`SELECT 1`));
		result.connected = true;

		// Check if billing tables exist
		const tableChecks = [
			{ table: "billing_provider", field: "billingProviders" },
			{ table: "billing_package", field: "billingPackages" },
			{ table: "user_subscription", field: "userSubscriptions" },
			{ table: "billing_transaction", field: "billingTransactions" },
			{ table: "billing_webhook", field: "billingWebhooks" },
		];

		for (const { table, field } of tableChecks) {
			try {
				await withRetry(() =>
					db.execute(sql`SELECT 1 FROM ${sql.identifier(table)} LIMIT 1`),
				);
				result.tablesExist[field as keyof typeof result.tablesExist] = true;
			} catch (error) {
				result.errors.push(
					`Billing table '${table}' does not exist or is not accessible`,
				);
				result.tablesExist[field as keyof typeof result.tablesExist] = false;
			}
		}

		// Check for existing data
		if (result.tablesExist.billingProviders) {
			try {
				const providersCount = await db
					.select()
					.from(billingProviders)
					.limit(1);
				if (providersCount.length === 0) {
					result.warnings.push("No billing providers configured in database");
				}
			} catch (error) {
				result.warnings.push("Could not check billing providers data");
			}
		}

		if (result.tablesExist.billingPackages) {
			try {
				const packagesCount = await db.select().from(billingPackages).limit(1);
				if (packagesCount.length === 0) {
					result.warnings.push("No billing packages configured in database");
				}
			} catch (error) {
				result.warnings.push("Could not check billing packages data");
			}
		}
	} catch (error) {
		result.connected = false;
		result.errors.push(
			`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	return result;
}

export async function testBillingTableOperations(): Promise<{
	success: boolean;
	operations: {
		operation: string;
		success: boolean;
		error?: string;
	}[];
}> {
	const operations: { operation: string; success: boolean; error?: string }[] =
		[];
	let allSuccess = true;

	// Test basic queries on each table
	const testQueries = [
		{
			name: "Select billing providers",
			query: () => db.select().from(billingProviders).limit(1),
		},
		{
			name: "Select billing packages",
			query: () => db.select().from(billingPackages).limit(1),
		},
		{
			name: "Select user subscriptions",
			query: () => db.select().from(userSubscriptions).limit(1),
		},
		{
			name: "Select billing transactions",
			query: () => db.select().from(billingTransactions).limit(1),
		},
		{
			name: "Select billing webhooks",
			query: () => db.select().from(billingWebhooks).limit(1),
		},
	];

	for (const test of testQueries) {
		try {
			await test.query();
			operations.push({
				operation: test.name,
				success: true,
			});
		} catch (error) {
			allSuccess = false;
			operations.push({
				operation: test.name,
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	return {
		success: allSuccess,
		operations,
	};
}
