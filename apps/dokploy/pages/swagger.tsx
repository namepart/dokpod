import { validateRequest } from "@dokploy/server";
import { createServerSideHelpers } from "@trpc/next";
import type { GetServerSidePropsContext, NextPage } from "next";
import { useEffect, useState } from "react";
import superjson from "superjson";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";

// SwaggerUI temporarily disabled for build optimization
// const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
// import "swagger-ui-react/swagger-ui.css";

const Home: NextPage = () => {
	const { data } = api.settings.getOpenApiDocument.useQuery();
	const [spec, setSpec] = useState({});

	useEffect(() => {
		if (data) {
			const protocolAndHost = `${window.location.protocol}//${window.location.host}/api`;
			const newSpec = {
				...data,
				servers: [{ url: protocolAndHost }],
				externalDocs: {
					url: `${protocolAndHost}/settings.getOpenApiDocument`,
				},
			};
			setSpec(newSpec);
		}
	}, [data]);

	return (
		<div className="h-screen bg-white">
			<div className="p-8">
				<h1 className="text-2xl font-bold mb-4">Swagger UI</h1>
				<p className="text-gray-600 mb-4">
					Swagger UI is temporarily disabled during build optimization.
				</p>
				<p className="text-sm text-gray-500">
					API documentation will be available after resolving dependency chain
					issues.
				</p>
			</div>
		</div>
	);
};

export default Home;

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const { user } = await validateRequest(context.req, context.res);

	if (!user) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}

	if (user.rol !== "admin") {
		return {
			redirect: {
				destination: "/dashboard/projects",
				permanent: false,
			},
		};
	}

	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: context.req as any,
			res: context.res as any,
			db: null as any,
			user: user,
		},
		transformer: superjson,
	});

	try {
		await helpers.settings.getOpenApiDocument.prefetch();
		return {
			props: {
				trpcState: helpers.dehydrate(),
			},
		};
	} catch (error) {
		return {
			props: {},
		};
	}
}
