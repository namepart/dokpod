// Billing Service Stub for Dokpod
// This ensures Next.js can resolve the billing service imports

export const createBillingAccount = () => {
	return Promise.resolve({ success: true });
};

export const processBillingWebhook = () => {
	return Promise.resolve({ success: true });
};

export const getBillingStatus = () => {
	return Promise.resolve({ status: "active" });
};

export default {
	createBillingAccount,
	processBillingWebhook,
	getBillingStatus,
};
