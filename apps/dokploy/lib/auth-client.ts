// Better-auth client - only available in browser environment
let authClient: any;

if (typeof window !== "undefined") {
	// Dynamic import for client-side only
	import("better-auth/client/plugins").then(async (plugins) => {
		const { createAuthClient } = await import("better-auth/react");

		authClient = createAuthClient({
			// baseURL: "http://localhost:3000", // the base url of your auth server
			plugins: [
				plugins.organizationClient(),
				plugins.twoFactorClient(),
				plugins.apiKeyClient(),
				plugins.adminClient(),
			],
		});
	});
} else {
	// Server-side fallback
	authClient = {
		signIn: { email: () => Promise.resolve({}) },
		signUp: { email: () => Promise.resolve({}) },
		signOut: () => Promise.resolve({}),
		useSession: () => ({ data: null, error: null }),
	};
}

export { authClient };
