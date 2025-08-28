import { DashboardLayout } from "components/layouts/dashboard-layout";
import BillingAdminPanel from "components/dashboard/settings/billing/billing-admin-panel";
import { ShowBilling } from "components/dashboard/settings/billing/show-billing";
import { ReactElement } from "react";

export default function BillingPage() {
  return (
    <div className="pb-10">
      <div className="flex flex-col gap-4">
        <ShowBilling />
        <BillingAdminPanel />
      </div>
    </div>
  );
}

BillingPage.getLayout = (page: ReactElement) => <DashboardLayout>{page}</DashboardLayout>;
