/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

/** @type {import("next").NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	transpilePackages: ["@dokploy/server"],
	webpack: (config, { isServer }) => {
		// Handle missing babel runtime helpers and basic fallbacks
		config.resolve.fallback = {
			...config.resolve.fallback,
			"@babel/runtime/helpers/interopRequireDefault": false,
			"@babel/runtime/helpers/extends": false,
			"@babel/runtime/helpers/defineProperty": false,
			"@babel/runtime/helpers/toConsumableArray": false,
			"@babel/runtime/helpers/typeof": false,
			"@babel/runtime/helpers/slicedToArray": false,
			"@babel/runtime/helpers/objectWithoutProperties": false,
			"@babel/runtime/helpers/objectWithoutPropertiesLoose": false,
			"@babel/runtime/helpers/esm/extends": false,
			"@babel/runtime/helpers/esm/objectWithoutPropertiesLoose": false,
			"@babel/runtime/helpers/esm/createClass": false,
			"@babel/runtime/helpers/esm/inheritsLoose": false,
			"@babel/runtime/helpers/esm/assertThisInitialized": false,
			"@babel/runtime/helpers/esm/toConsumableArray": false,
			"@babel/runtime-corejs3/helpers/extends": false,
			"swagger-client/es/resolver/strategies/generic": false,
			"swagger-client/es/resolver/strategies/openapi-2": false,
			"swagger-client/es/resolver/strategies/openapi-3-0": false,
			"swagger-client/es/resolver/strategies/openapi-3-1-apidom": false,
			"swagger-client/es/resolver": false,
			"swagger-client/es/execute": false,
			"swagger-client/es/http": false,
			"swagger-client/es/subtree-resolver": false,
			"swagger-client/es/helpers": false,
			"lowlight/lib/core": false,
			"lowlight/lib": false,
			lowlight: false,
			"react-syntax-highlighter/dist/esm/light": false,
			"react-syntax-highlighter/dist/esm/languages/hljs/javascript": false,
			"react-syntax-highlighter/dist/esm/languages/hljs/json": false,
			"react-syntax-highlighter/dist/esm/languages/hljs/xml": false,
			"react-syntax-highlighter/dist/esm/languages/hljs/bash": false,
			"@lezer/highlight": false,
		};

		// Better module resolution for monorepo
		config.resolve.symlinks = false;

		// Enhanced resolve extensions
		config.resolve.extensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".json"];

		// Fix better-auth and React resolution + Noble packages exact mapping
		config.resolve.alias = {
			...config.resolve.alias,
			react: "react",
			"react-dom": "react-dom",
			// Map @noble submodules to exact exports (Noble 0.6.0 has managedNonce)
			"@noble/ciphers/chacha": "@noble/ciphers/chacha",
			"@noble/ciphers/utils": "@noble/ciphers/utils",
			"@noble/ciphers/webcrypto": "@noble/ciphers/webcrypto",
			"@noble/hashes/scrypt": "@noble/hashes/scrypt",
			"@noble/hashes/utils": "@noble/hashes/utils",
		};

		// Configure externals for better-auth React compatibility
		if (isServer) {
			config.externals = config.externals || [];
			if (Array.isArray(config.externals)) {
				config.externals.push(({ request }, callback) => {
					// Handle better-auth React import
					if (request?.includes("better-auth") && request?.includes("react")) {
						return callback(null, "commonjs react");
					}
					// Handle @babel/runtime issues in CodeMirror theme
					if (request === "@babel/runtime/helpers/interopRequireDefault") {
						return callback(
							null,
							"commonjs @babel/runtime/helpers/interopRequireDefault",
						);
					}
					// Handle @uiw/codemirror-theme-github server-side
					if (request?.includes("@uiw/codemirror-theme-github")) {
						return callback(null, `commonjs ${request}`);
					}
					callback();
				});
			}
		}

		// Handle webpack module errors gracefully
		config.ignoreWarnings = [
			{ module: /node_modules/ },
			/Module not found.*@noble/,
			/Can't resolve.*@noble/,
			/Attempted import error.*managedNonce/,
			/Can't resolve.*kysely/,
			/Module not found.*@trpc/,
			/Can't resolve.*@trpc/,
			/Cannot find package 'react'.*better-auth/,
		];

		return config;
	},
	/**
	 * If you are using `appDir` then you must comment the below `i18n` config out.
	 *
	 * @see https://github.com/vercel/next.js/issues/41980
	 */
	i18n: {
		locales: ["en"],
		defaultLocale: "en",
	},
};

export default nextConfig;
