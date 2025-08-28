import { processWebhook } from "@dokploy/server/services/billing/billing-service";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const signature = req.headers["paypal-transmission-sig"] as string;
		const payload = req.body;

		// Process the webhook
		await processWebhook("paypal", payload, signature);

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("PayPal webhook error:", error);
		res.status(400).json({
			error:
				error instanceof Error ? error.message : "Webhook processing failed",
		});
	}
}
