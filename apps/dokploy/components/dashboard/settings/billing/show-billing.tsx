import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import BillingOverview from "../../billing/billing-overview";

export const ShowBilling = () => {
	const { data: isCloud, isLoading } = api.settings.isCloud.useQuery();

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isCloud) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-center">
				<h2 className="text-2xl font-bold mb-4">Billing Not Available</h2>
				<p className="text-muted-foreground">
					Billing features are only available in Dokploy Cloud.
				</p>
			</div>
		);
	}

	return <BillingOverview />;
};
