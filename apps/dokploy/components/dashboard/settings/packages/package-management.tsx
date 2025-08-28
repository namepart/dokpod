import {
	AlertTriangle,
	CheckCircle,
	Database,
	Edit,
	Package,
	Plus,
	Save,
	Server,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

export default function PackageManagement() {
	const [selectedPackage, setSelectedPackage] = useState("");
	const [packageForm, setPackageForm] = useState({
		name: "",
		description: "",
		price: "",
		currency: "USD",
		billingCycle: "monthly",
		maxProjects: 5,
		maxApplications: 10,
		maxDatabases: 5,
		maxDomains: 10,
		maxUsers: 1,
		cpuLimit: 1000,
		memoryLimit: 1024,
		storageLimit: 10240,
		bandwidthLimit: 102400,
		isActive: true,
		isPublic: true,
		sortOrder: 1,
		features: {
			multiNode: false,
			customDomains: true,
			sslCertificates: true,
			backups: true,
			monitoring: true,
			apiAccess: false,
			prioritySupport: false,
			whiteLabel: false,
		},
	});

	const {
		data: packages,
		isLoading,
		refetch,
	} = api.billing.getPackages.useQuery({
		includeInactive: true,
	});
	const createPackageMutation = api.billing.createPackage.useMutation();
	const updatePackageMutation = api.billing.updatePackage.useMutation();
	const deletePackageMutation = api.billing.deletePackage.useMutation();

	const billingCycles = [
		{ value: "monthly", label: "Monthly" },
		{ value: "yearly", label: "Yearly" },
		{ value: "one-time", label: "One-time" },
	];

	const currencies = [
		{ value: "USD", label: "USD ($)" },
		{ value: "EUR", label: "EUR (€)" },
		{ value: "GBP", label: "GBP (£)" },
		{ value: "BDT", label: "BDT (৳)" },
	];

	const handleSavePackage = async () => {
		try {
			if (selectedPackage) {
				await updatePackageMutation.mutateAsync({
					id: selectedPackage,
					...packageForm,
				});
				toast.success("Package updated successfully");
			} else {
				await createPackageMutation.mutateAsync(packageForm);
				toast.success("Package created successfully");
			}

			refetch();
			resetForm();
		} catch (error) {
			toast.error("Failed to save package");
		}
	};

	const handleDeletePackage = async (id: string) => {
		try {
			await deletePackageMutation.mutateAsync({ id });
			toast.success("Package deleted successfully");
			refetch();
		} catch (error) {
			toast.error("Failed to delete package");
		}
	};

	const resetForm = () => {
		setSelectedPackage("");
		setPackageForm({
			name: "",
			description: "",
			price: "",
			currency: "USD",
			billingCycle: "monthly",
			maxProjects: 5,
			maxApplications: 10,
			maxDatabases: 5,
			maxDomains: 10,
			maxUsers: 1,
			cpuLimit: 1000,
			memoryLimit: 1024,
			storageLimit: 10240,
			bandwidthLimit: 102400,
			isActive: true,
			isPublic: true,
			sortOrder: 1,
			features: {
				multiNode: false,
				customDomains: true,
				sslCertificates: true,
				backups: true,
				monitoring: true,
				apiAccess: false,
				prioritySupport: false,
				whiteLabel: false,
			},
		});
	};

	const editPackage = (pkg: any) => {
		setSelectedPackage(pkg.id);
		setPackageForm({
			name: pkg.name,
			description: pkg.description || "",
			price: pkg.price,
			currency: pkg.currency,
			billingCycle: pkg.billingCycle,
			maxProjects: pkg.maxProjects,
			maxApplications: pkg.maxApplications,
			maxDatabases: pkg.maxDatabases,
			maxDomains: pkg.maxDomains,
			maxUsers: pkg.maxUsers,
			cpuLimit: pkg.cpuLimit || 1000,
			memoryLimit: pkg.memoryLimit || 1024,
			storageLimit: pkg.storageLimit || 10240,
			bandwidthLimit: pkg.bandwidthLimit || 102400,
			isActive: pkg.isActive,
			isPublic: pkg.isPublic,
			sortOrder: pkg.sortOrder,
			features: pkg.features || {
				multiNode: false,
				customDomains: true,
				sslCertificates: true,
				backups: true,
				monitoring: true,
				apiAccess: false,
				prioritySupport: false,
				whiteLabel: false,
			},
		});
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Package Management</h1>
					<p className="text-muted-foreground">
						Create and manage subscription packages with resource limits
					</p>
				</div>
				<Button
					onClick={resetForm}
					variant="outline"
					className="flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					New Package
				</Button>
			</div>

			<Tabs defaultValue="packages" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="packages">Package List</TabsTrigger>
					<TabsTrigger value="form">
						{selectedPackage ? "Edit Package" : "Create Package"}
					</TabsTrigger>
				</TabsList>

				{/* Package List */}
				<TabsContent value="packages" className="space-y-4">
					{packages?.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>
								No packages found. Create your first package to get started.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{packages?.map((pkg) => (
								<Card key={pkg.id} className="relative">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="flex items-center gap-2">
												{pkg.name}
												{pkg.isActive ? (
													<CheckCircle className="w-4 h-4 text-green-600" />
												) : (
													<AlertTriangle className="w-4 h-4 text-yellow-600" />
												)}
											</CardTitle>
											<Badge variant={pkg.isActive ? "default" : "secondary"}>
												{pkg.isActive ? "Active" : "Inactive"}
											</Badge>
										</div>
										<CardDescription>
											{pkg.description || "No description"}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-2xl font-bold">
												{pkg.price === "0.00"
													? "Free"
													: `${pkg.currency} ${pkg.price}`}
											</span>
											<span className="text-sm text-muted-foreground">
												/{pkg.billingCycle}
											</span>
										</div>

										<div className="space-y-2 text-sm">
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-1">
													<Server className="w-3 h-3" />
													Projects
												</span>
												<span>
													{pkg.maxProjects === -1
														? "Unlimited"
														: pkg.maxProjects}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-1">
													<Package className="w-3 h-3" />
													Applications
												</span>
												<span>
													{pkg.maxApplications === -1
														? "Unlimited"
														: pkg.maxApplications}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-1">
													<Database className="w-3 h-3" />
													Databases
												</span>
												<span>
													{pkg.maxDatabases === -1
														? "Unlimited"
														: pkg.maxDatabases}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-1">
													<Users className="w-3 h-3" />
													Users
												</span>
												<span>
													{pkg.maxUsers === -1 ? "Unlimited" : pkg.maxUsers}
												</span>
											</div>
										</div>

										<div className="flex items-center gap-2 pt-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => editPackage(pkg)}
												className="flex-1"
											>
												<Edit className="w-3 h-3 mr-1" />
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeletePackage(pkg.id)}
												className="text-red-600 hover:text-red-700"
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Package Form */}
				<TabsContent value="form">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="w-5 h-5" />
								{selectedPackage ? "Edit Package" : "Create New Package"}
							</CardTitle>
							<CardDescription>
								Configure package details, pricing, and resource limits
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Basic Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="name">Package Name</Label>
									<Input
										id="name"
										value={packageForm.name}
										onChange={(e) =>
											setPackageForm((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										placeholder="Basic Plan"
									/>
								</div>
								<div>
									<Label htmlFor="price">Price</Label>
									<Input
										id="price"
										type="number"
										step="0.01"
										value={packageForm.price}
										onChange={(e) =>
											setPackageForm((prev) => ({
												...prev,
												price: e.target.value,
											}))
										}
										placeholder="9.99"
									/>
								</div>
								<div>
									<Label htmlFor="currency">Currency</Label>
									<Select
										value={packageForm.currency}
										onValueChange={(value) =>
											setPackageForm((prev) => ({ ...prev, currency: value }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{currencies.map((currency) => (
												<SelectItem key={currency.value} value={currency.value}>
													{currency.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="billingCycle">Billing Cycle</Label>
									<Select
										value={packageForm.billingCycle}
										onValueChange={(value) =>
											setPackageForm((prev) => ({
												...prev,
												billingCycle: value,
											}))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{billingCycles.map((cycle) => (
												<SelectItem key={cycle.value} value={cycle.value}>
													{cycle.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={packageForm.description}
									onChange={(e) =>
										setPackageForm((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Perfect for small projects and teams"
									rows={3}
								/>
							</div>

							{/* Service Limits */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Service Limits</h3>
								<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
									<div>
										<Label htmlFor="maxProjects">Projects</Label>
										<Input
											id="maxProjects"
											type="number"
											value={packageForm.maxProjects}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													maxProjects: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="maxApplications">Applications</Label>
										<Input
											id="maxApplications"
											type="number"
											value={packageForm.maxApplications}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													maxApplications: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="maxDatabases">Databases</Label>
										<Input
											id="maxDatabases"
											type="number"
											value={packageForm.maxDatabases}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													maxDatabases: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="maxDomains">Domains</Label>
										<Input
											id="maxDomains"
											type="number"
											value={packageForm.maxDomains}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													maxDomains: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="maxUsers">Users</Label>
										<Input
											id="maxUsers"
											type="number"
											value={packageForm.maxUsers}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													maxUsers: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
								</div>
							</div>

							{/* Resource Limits */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Resource Limits</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<Label htmlFor="cpuLimit">CPU (millicores)</Label>
										<Input
											id="cpuLimit"
											type="number"
											value={packageForm.cpuLimit}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													cpuLimit: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="memoryLimit">Memory (MB)</Label>
										<Input
											id="memoryLimit"
											type="number"
											value={packageForm.memoryLimit}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													memoryLimit: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="storageLimit">Storage (MB)</Label>
										<Input
											id="storageLimit"
											type="number"
											value={packageForm.storageLimit}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													storageLimit: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
									<div>
										<Label htmlFor="bandwidthLimit">Bandwidth (MB)</Label>
										<Input
											id="bandwidthLimit"
											type="number"
											value={packageForm.bandwidthLimit}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													bandwidthLimit: Number.parseInt(e.target.value),
												}))
											}
										/>
									</div>
								</div>
							</div>

							{/* Package Settings */}
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Package Settings</h3>
								<div className="flex items-center space-x-6">
									<div className="flex items-center space-x-2">
										<Switch
											id="isActive"
											checked={packageForm.isActive}
											onCheckedChange={(checked) =>
												setPackageForm((prev) => ({
													...prev,
													isActive: checked,
												}))
											}
										/>
										<Label htmlFor="isActive">Active</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											id="isPublic"
											checked={packageForm.isPublic}
											onCheckedChange={(checked) =>
												setPackageForm((prev) => ({
													...prev,
													isPublic: checked,
												}))
											}
										/>
										<Label htmlFor="isPublic">Public</Label>
									</div>
									<div>
										<Label htmlFor="sortOrder">Sort Order</Label>
										<Input
											id="sortOrder"
											type="number"
											value={packageForm.sortOrder}
											onChange={(e) =>
												setPackageForm((prev) => ({
													...prev,
													sortOrder: Number.parseInt(e.target.value),
												}))
											}
											className="w-20"
										/>
									</div>
								</div>
							</div>

							<Button
								onClick={handleSavePackage}
								className="w-full"
								disabled={!packageForm.name || !packageForm.price}
							>
								<Save className="w-4 h-4 mr-2" />
								{selectedPackage ? "Update Package" : "Create Package"}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
