import { DashboardLayout } from "components/layouts/dashboard-layout";
import PackageManagement from "components/dashboard/settings/packages/package-management";
import { ReactElement } from "react";

export default function PackagesPage() {
  return (
    <div className="pb-10">
      <PackageManagement />
    </div>
  );
}

PackagesPage.getLayout = (page: ReactElement) => <DashboardLayout>{page}</DashboardLayout>;
