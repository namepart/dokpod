// Configuration validation helpers for production deployment

export interface ConfigValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

// Common production configuration issues
export function validateProductionConfig(): ConfigValidation {
	const result: ConfigValidation = {
		isValid: true,
		errors: [],
		warnings: [],
		suggestions: [],
	};

	// Node environment validation
	const nodeEnv = process.env.NODE_ENV;
	if (nodeEnv !== "production") {
		result.warnings.push(
			`NODE_ENV is set to '${nodeEnv || "undefined"}', expected 'production' for production deployment`,
		);
		if (!nodeEnv) {
			result.suggestions.push("Set NODE_ENV=production environment variable");
		}
	}

	// Database URL validation
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		result.errors.push("DATABASE_URL is not configured");
		result.isValid = false;
		result.suggestions.push(
			"Configure DATABASE_URL with proper PostgreSQL connection string",
		);
	} else {
		// Basic URL format validation
		if (
			!dbUrl.startsWith("postgresql://") &&
			!dbUrl.startsWith("postgres://")
		) {
			result.warnings.push(
				"DATABASE_URL should use postgresql:// or postgres:// scheme",
			);
		}
	}

	// Security configuration
	const nextAuthSecret = process.env.NEXTAUTH_SECRET;
	if (!nextAuthSecret) {
		result.errors.push("NEXTAUTH_SECRET is not configured");
		result.isValid = false;
		result.suggestions.push(
			"Generate and set NEXTAUTH_SECRET for authentication security",
		);
	} else if (nextAuthSecret.length < 32) {
		result.warnings.push(
			"NEXTAUTH_SECRET should be at least 32 characters long",
		);
		result.suggestions.push("Use a longer, more secure NEXTAUTH_SECRET");
	}

	// Build configuration
	const buildMode = process.env.BUILD_MODE;
	if (!buildMode) {
		result.warnings.push("BUILD_MODE is not set");
		result.suggestions.push(
			"Set BUILD_MODE environment variable for build tracking",
		);
	}

	// Host and port configuration
	const host = process.env.HOST;
	const port = process.env.PORT;

	if (host && host !== "0.0.0.0" && host !== "localhost") {
		result.suggestions.push(
			"Consider using HOST=0.0.0.0 for container deployments",
		);
	}

	if (port) {
		const portNum = Number.parseInt(port);
		if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
			result.errors.push("PORT must be a valid port number (1-65535)");
			result.isValid = false;
		}
	}

	// Docker-specific checks
	if (process.env.DOCKER_HOST || process.env.DOCKER_SOCKET) {
		result.suggestions.push(
			"Ensure Docker socket is properly mounted and accessible",
		);
	}

	return result;
}

// Validate SSL/TLS configuration
export function validateSSLConfig(): ConfigValidation {
	const result: ConfigValidation = {
		isValid: true,
		errors: [],
		warnings: [],
		suggestions: [],
	};

	const nextAuthUrl = process.env.NEXTAUTH_URL;
	if (nextAuthUrl) {
		if (
			nextAuthUrl.startsWith("http://") &&
			!nextAuthUrl.includes("localhost")
		) {
			result.warnings.push(
				"NEXTAUTH_URL uses HTTP instead of HTTPS for non-localhost",
			);
			result.suggestions.push(
				"Use HTTPS (https://) for production NEXTAUTH_URL",
			);
		}
	}

	// Traefik SSL configuration (if applicable)
	const traefikAcmeEmail = process.env.TRAEFIK_ACME_EMAIL;
	if (!traefikAcmeEmail) {
		result.warnings.push(
			"TRAEFIK_ACME_EMAIL not configured (needed for SSL certificates)",
		);
		result.suggestions.push(
			"Set TRAEFIK_ACME_EMAIL for automatic SSL certificate generation",
		);
	}

	return result;
}

// Get comprehensive configuration summary
export function getConfigSummary(): {
	production: ConfigValidation;
	ssl: ConfigValidation;
	overall: {
		readyForProduction: boolean;
		totalErrors: number;
		totalWarnings: number;
		totalSuggestions: number;
	};
} {
	const production = validateProductionConfig();
	const ssl = validateSSLConfig();

	return {
		production,
		ssl,
		overall: {
			readyForProduction: production.isValid && ssl.isValid,
			totalErrors: production.errors.length + ssl.errors.length,
			totalWarnings: production.warnings.length + ssl.warnings.length,
			totalSuggestions: production.suggestions.length + ssl.suggestions.length,
		},
	};
}
