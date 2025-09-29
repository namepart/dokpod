import type { NextApiRequest, NextApiResponse } from "next";
import { getSystemStatus } from "@/lib/health-monitoring";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const startTime = Date.now();

	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const systemStatus = await getSystemStatus();
		const responseTime = Date.now() - startTime;

		// Return appropriate HTTP status based on system status
		const httpStatus =
			systemStatus.status === "operational"
				? 200
				: systemStatus.status === "degraded"
					? 200
					: // Still return 200 for degraded
						503; // Service unavailable for down

		// Add timing metrics to response
		const responseWithMetrics = {
			...systemStatus,
			requestMetrics: {
				responseTimeMs: responseTime,
				timestamp: new Date().toISOString(),
			},
		};

		res.status(httpStatus).json(responseWithMetrics);
	} catch (error) {
		const responseTime = Date.now() - startTime;
		console.error("System status check failed:", {
			timestamp: new Date().toISOString(),
			responseTime,
			error:
				error instanceof Error ? error.message : "System status check failed",
		});
		res.status(500).json({
			system: "dokpod",
			version: "unknown",
			status: "down",
			lastCheck: new Date().toISOString(),
			error:
				error instanceof Error ? error.message : "System status check failed",
			requestMetrics: {
				responseTimeMs: responseTime,
				timestamp: new Date().toISOString(),
			},
		});
	}
}
