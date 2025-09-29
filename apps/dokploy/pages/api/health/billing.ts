import type { NextApiRequest, NextApiResponse } from "next";
import { performHealthCheck } from "@/lib/health-monitoring";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const startTime = Date.now();

	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const healthCheck = await performHealthCheck();
		const responseTime = Date.now() - startTime;

		// Return appropriate HTTP status based on health
		const httpStatus =
			healthCheck.status === "healthy"
				? 200
				: healthCheck.status === "degraded"
					? 200
					: // Still return 200 for degraded
						503; // Service unavailable for unhealthy

		// Add timing metrics to response
		const responseWithMetrics = {
			...healthCheck,
			requestMetrics: {
				responseTimeMs: responseTime,
				timestamp: new Date().toISOString(),
			},
		};

		res.status(httpStatus).json(responseWithMetrics);
	} catch (error) {
		const responseTime = Date.now() - startTime;
		console.error("Health check failed:", {
			timestamp: new Date().toISOString(),
			responseTime,
			error: error instanceof Error ? error.message : "Health check failed",
		});
		res.status(500).json({
			status: "unhealthy",
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : "Health check failed",
			requestMetrics: {
				responseTimeMs: responseTime,
				timestamp: new Date().toISOString(),
			},
		});
	}
}
