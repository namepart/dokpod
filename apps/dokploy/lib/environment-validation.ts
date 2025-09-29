// Environment variable validation for billing system
export interface EnvironmentValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	providers: {
		provider: "whmcs" | "stripe" | "paypal";
		configured: boolean;
		enabled: boolean;
		missingVars: string[];
	}[];
}

// Required environment variables for each provider
const PROVIDER_ENV_REQUIREMENTS = {
	whmcs: {
		required: ["WHMCS_URL", "WHMCS_IDENTIFIER", "WHMCS_SECRET"],
		optional: ["WHMCS_WEBHOOK_SECRET"],
	},
	stripe: {
		required: ["STRIPE_SECRET_KEY"],
		optional: ["STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
	},
	paypal: {
		required: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
		optional: ["PAYPAL_WEBHOOK_ID", "PAYPAL_MODE"],
	},
} as const;

export function validateBillingEnvironment(): EnvironmentValidation {
	const result: EnvironmentValidation = {
		isValid: true,
		errors: [],
		warnings: [],
		providers: [],
	};

	// Check database connection requirement
	if (!process.env.DATABASE_URL) {
		result.errors.push("DATABASE_URL is required for billing system");
		result.isValid = false;
	}

	// Validate each billing provider
	for (const [provider, config] of Object.entries(PROVIDER_ENV_REQUIREMENTS)) {
		const providerKey = provider as keyof typeof PROVIDER_ENV_REQUIREMENTS;
		const enabledKey = `${provider.toUpperCase()}_ENABLED`;
		const isEnabled = process.env[enabledKey] === "true";

		const missingRequired: string[] = [];
		const missingOptional: string[] = [];

		// Check required variables
		for (const envVar of config.required) {
			if (!process.env[envVar]) {
				missingRequired.push(envVar);
			}
		}

		// Check optional variables
		for (const envVar of config.optional) {
			if (!process.env[envVar]) {
				missingOptional.push(envVar);
			}
		}

		const isConfigured = missingRequired.length === 0;

		result.providers.push({
			provider: providerKey,
			configured: isConfigured,
			enabled: isEnabled,
			missingVars: missingRequired,
		});

		// Add errors for enabled but misconfigured providers
		if (isEnabled && !isConfigured) {
			result.errors.push(
				`${provider.toUpperCase()} is enabled but missing required environment variables: ${missingRequired.join(", ")}`,
			);
			result.isValid = false;
		}

		// Add warnings for missing optional variables
		if (isEnabled && missingOptional.length > 0) {
			result.warnings.push(
				`${provider.toUpperCase()} missing optional environment variables: ${missingOptional.join(", ")}`,
			);
		}

		// Warn if provider is configured but not enabled
		if (isConfigured && !isEnabled) {
			result.warnings.push(
				`${provider.toUpperCase()} is configured but not enabled (set ${enabledKey}=true to enable)`,
			);
		}
	}

	// Check if at least one billing provider is enabled
	const enabledProviders = result.providers.filter(
		(p) => p.enabled && p.configured,
	);
	if (enabledProviders.length === 0) {
		result.warnings.push(
			"No billing providers are properly configured and enabled. This will limit billing functionality.",
		);
	}

	return result;
}

export function getEnvironmentSummary(): {
	nodeVersion: string;
	nodeEnv: string;
	databaseConnected: boolean;
	billingValidation: EnvironmentValidation;
} {
	return {
		nodeVersion: process.version,
		nodeEnv: process.env.NODE_ENV || "development",
		databaseConnected: !!process.env.DATABASE_URL,
		billingValidation: validateBillingEnvironment(),
	};
}
