import {
	AlertTriangle,
	CheckCircle,
	Eye,
	EyeOff,
	Plus,
	Save,
	Settings,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

export default function BillingAdminPanel() {
	const [showApiKey, setShowApiKey] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [providerConfig, setProviderConfig] = useState({
		name: "",
		type: "",
		apiUrl: "",
		apiKey: "",
		apiSecret: "",
		config: "",
		isActive: true,
	});

	const {
		data: providers,
		isLoading,
		refetch,
	} = api.billing.getBillingProviders.useQuery();
	const createProviderMutation =
		api.billing.createBillingProvider.useMutation();
	const updateProviderMutation =
		api.billing.updateBillingProvider.useMutation();
	const deleteProviderMutation =
		api.billing.deleteBillingProvider.useMutation();

	const providerTypes = [
		{ value: "whmcs", label: "WHMCS" },
		{ value: "stripe", label: "Stripe" },
		{ value: "paypal", label: "PayPal" },
		{ value: "paddle", label: "Paddle" },
		{ value: "chargebee", label: "Chargebee" },
	];

	const handleSaveProvider = async () => {
		try {
			if (selectedProvider) {
				await updateProviderMutation.mutateAsync({
					id: selectedProvider,
					...providerConfig,
					config: providerConfig.config
						? JSON.parse(providerConfig.config)
						: {},
				});
				toast.success("Provider updated successfully");
			} else {
				await createProviderMutation.mutateAsync({
					...providerConfig,
					config: providerConfig.config
						? JSON.parse(providerConfig.config)
						: {},
				});
				toast.success("Provider created successfully");
			}

			refetch();
			resetForm();
		} catch (error) {
			toast.error("Failed to save provider");
		}
	};

	const handleDeleteProvider = async (id: string) => {
		try {
			await deleteProviderMutation.mutateAsync({ id });
			toast.success("Provider deleted successfully");
			refetch();
		} catch (error) {
			toast.error("Failed to delete provider");
		}
	};

	const resetForm = () => {
		setSelectedProvider("");
		setProviderConfig({
			name: "",
			type: "",
			apiUrl: "",
			apiKey: "",
			apiSecret: "",
			config: "",
			isActive: true,
		});
	};

	const editProvider = (provider: any) => {
		setSelectedProvider(provider.id);
		setProviderConfig({
			name: provider.name,
			type: provider.type,
			apiUrl: provider.apiUrl || "",
			apiKey: provider.apiKey || "",
			apiSecret: provider.apiSecret || "",
			config: JSON.stringify(provider.config || {}, null, 2),
			isActive: provider.isActive,
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
					<h1 className="text-3xl font-bold">Billing Administration</h1>
					<p className="text-muted-foreground">
						Configure billing providers and manage subscription settings
					</p>
				</div>
				<Button
					onClick={resetForm}
					variant="outline"
					className="flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Provider
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Provider Configuration */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="w-5 h-5" />
							{selectedProvider ? "Edit Provider" : "Add New Provider"}
						</CardTitle>
						<CardDescription>
							Configure billing provider settings and API credentials
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="name">Provider Name</Label>
								<Input
									id="name"
									value={providerConfig.name}
									onChange={(e) =>
										setProviderConfig((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder="My WHMCS Provider"
								/>
							</div>
							<div>
								<Label htmlFor="type">Provider Type</Label>
								<Select
									value={providerConfig.type}
									onValueChange={(value) =>
										setProviderConfig((prev) => ({ ...prev, type: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select provider type" />
									</SelectTrigger>
									<SelectContent>
										{providerTypes.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<Label htmlFor="apiUrl">API URL</Label>
							<Input
								id="apiUrl"
								value={providerConfig.apiUrl}
								onChange={(e) =>
									setProviderConfig((prev) => ({
										...prev,
										apiUrl: e.target.value,
									}))
								}
								placeholder="https://your-whmcs.com/includes/api.php"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="apiKey">API Key/Username</Label>
								<div className="relative">
									<Input
										id="apiKey"
										type={showApiKey ? "text" : "password"}
										value={providerConfig.apiKey}
										onChange={(e) =>
											setProviderConfig((prev) => ({
												...prev,
												apiKey: e.target.value,
											}))
										}
										placeholder="API Key or Username"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full px-3"
										onClick={() => setShowApiKey(!showApiKey)}
									>
										{showApiKey ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</Button>
								</div>
							</div>
							<div>
								<Label htmlFor="apiSecret">API Secret/Password</Label>
								<Input
									id="apiSecret"
									type="password"
									value={providerConfig.apiSecret}
									onChange={(e) =>
										setProviderConfig((prev) => ({
											...prev,
											apiSecret: e.target.value,
										}))
									}
									placeholder="API Secret or Password"
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="config">Additional Configuration (JSON)</Label>
							<Textarea
								id="config"
								value={providerConfig.config}
								onChange={(e) =>
									setProviderConfig((prev) => ({
										...prev,
										config: e.target.value,
									}))
								}
								placeholder='{"webhookSecret": "your-webhook-secret", "defaultCurrency": "USD"}'
								rows={4}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Switch
								id="isActive"
								checked={providerConfig.isActive}
								onCheckedChange={(checked) =>
									setProviderConfig((prev) => ({ ...prev, isActive: checked }))
								}
							/>
							<Label htmlFor="isActive">Enable this provider</Label>
						</div>

						<Button
							onClick={handleSaveProvider}
							className="w-full"
							disabled={!providerConfig.name || !providerConfig.type}
						>
							<Save className="w-4 h-4 mr-2" />
							{selectedProvider ? "Update Provider" : "Create Provider"}
						</Button>
					</CardContent>
				</Card>

				{/* Active Providers */}
				<Card>
					<CardHeader>
						<CardTitle>Active Providers</CardTitle>
						<CardDescription>
							Manage your configured billing providers
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{providers?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p>No billing providers configured yet.</p>
								<p className="text-sm">
									Add your first provider to get started.
								</p>
							</div>
						) : (
							providers?.map((provider) => (
								<div
									key={provider.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center space-x-3">
										<div className="flex items-center space-x-2">
											{provider.isActive ? (
												<CheckCircle className="w-5 h-5 text-green-600" />
											) : (
												<AlertTriangle className="w-5 h-5 text-yellow-600" />
											)}
											<div>
												<h4 className="font-medium">{provider.name}</h4>
												<p className="text-sm text-muted-foreground">
													{
														providerTypes.find((t) => t.value === provider.type)
															?.label
													}
												</p>
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Badge
											variant={provider.isActive ? "default" : "secondary"}
										>
											{provider.isActive ? "Active" : "Inactive"}
										</Badge>
										<Button
											variant="outline"
											size="sm"
											onClick={() => editProvider(provider)}
										>
											Edit
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteProvider(provider.id)}
											className="text-red-600 hover:text-red-700"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{/* Configuration Tips */}
			<Alert>
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Configuration Tips</AlertTitle>
				<AlertDescription className="space-y-2">
					<p>
						<strong>WHMCS:</strong> Use your WHMCS API credentials. API URL
						should be: https://your-domain.com/includes/api.php
					</p>
					<p>
						<strong>Stripe:</strong> Use your Stripe secret key as API Key. API
						URL: https://api.stripe.com
					</p>
					<p>
						<strong>PayPal:</strong> Use your PayPal REST API credentials. API
						URL: https://api.paypal.com or https://api.sandbox.paypal.com
					</p>
					<p>
						Store sensitive configuration like webhook secrets in the Additional
						Configuration field as JSON.
					</p>
				</AlertDescription>
			</Alert>
		</div>
	);
}
