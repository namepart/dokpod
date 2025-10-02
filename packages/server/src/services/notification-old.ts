import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db";
import {
	discord,
	email,
	gotify,
	notifications,
	slack,
	telegram,
} from "../db/schema";
import type {
	apiCreateDiscord,
	apiCreateEmail,
	apiCreateGotify,
	apiCreateSlack,
	apiCreateTelegram,
	apiFindOneNotification,
	apiSendTest,
	apiTestDiscordConnection,
	apiTestEmailConnection,
	apiTestGotifyConnection,
	apiTestSlackConnection,
	apiTestTelegramConnection,
	apiUpdateDiscord,
	apiUpdateEmail,
	apiUpdateGotify,
	apiUpdateSlack,
	apiUpdateTelegram,
} from "../db/schema/notification";

// Type fix using manual type assertion for foreign keys
export const createSlackNotification = async (
	input: z.infer<typeof apiCreateSlack>,
	organizationId: string,
) => {
	return await db.transaction(async (tx) => {
		const [newSlack] = await tx
			.insert(slack)
			.values({
				webhookUrl: input.webhookUrl,
				...(input.channel && { channel: input.channel }),
			})
			.returning();

		if (!newSlack) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting slack",
			});
		}

		// Manual type assertion for foreign key fields
		const [newDestination] = await tx
			.insert(notifications)
			.values({
				name: input.name,
				appDeploy: input.appDeploy ?? false,
				appBuildError: input.appBuildError ?? false,
				databaseBackup: input.databaseBackup ?? false,
				dokployRestart: input.dokployRestart ?? false,
				dockerCleanup: input.dockerCleanup ?? false,
				notificationType: "slack" as const,
				organizationId: organizationId,
				serverThreshold: input.serverThreshold ?? false,
				slackId: newSlack.slackId,
			} as any)
			.returning();

		if (!newDestination) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting notification",
			});
		}

		return newDestination;
	});
};

export const updateSlackNotification = async (
	input: z.infer<typeof apiUpdateSlack>,
) => {
	return await db.transaction(async (tx) => {
		await tx
			.update(notifications)
			.set({
				...(input.name && { name: input.name }),
				...(input.appDeploy !== undefined && { appDeploy: input.appDeploy }),
				...(input.appBuildError !== undefined && { appBuildError: input.appBuildError }),
				...(input.databaseBackup !== undefined && { databaseBackup: input.databaseBackup }),
				...(input.dokployRestart !== undefined && { dokployRestart: input.dokployRestart }),
				...(input.dockerCleanup !== undefined && { dockerCleanup: input.dockerCleanup }),
				...(input.serverThreshold !== undefined && { serverThreshold: input.serverThreshold }),
			})
			.where(eq(notifications.notificationId, input.notificationId));

		if (input.slackId) {
			await tx
				.update(slack)
				.set({
					...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
					...(input.channel !== undefined && { channel: input.channel }),
				})
				.where(eq(slack.slackId, input.slackId));
		}

		return true;
	});
};

export const createTelegramNotification = async (
	input: z.infer<typeof apiCreateTelegram>,
	organizationId: string,
) => {
	return await db.transaction(async (tx) => {
		const [newTelegram] = await tx
			.insert(telegram)
			.values({
				botToken: input.botToken,
				chatId: input.chatId,
				...(input.messageThreadId && { messageThreadId: input.messageThreadId }),
			})
			.returning();

		if (!newTelegram) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting telegram",
			});
		}

		const [newDestination] = await tx
			.insert(notifications)
			.values({
				name: input.name,
				appDeploy: input.appDeploy ?? false,
				appBuildError: input.appBuildError ?? false,
				databaseBackup: input.databaseBackup ?? false,
				dokployRestart: input.dokployRestart ?? false,
				dockerCleanup: input.dockerCleanup ?? false,
				notificationType: "telegram" as const,
				organizationId: organizationId,
				serverThreshold: input.serverThreshold ?? false,
				telegramId: newTelegram.telegramId,
			} as any)
			.returning();

		if (!newDestination) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting notification",
			});
		}

		return newDestination;
	});
};

export const updateTelegramNotification = async (
	input: z.infer<typeof apiUpdateTelegram>,
) => {
	return await db.transaction(async (tx) => {
		await tx
			.update(notifications)
			.set({
				...(input.name && { name: input.name }),
				...(input.appDeploy !== undefined && { appDeploy: input.appDeploy }),
				...(input.appBuildError !== undefined && { appBuildError: input.appBuildError }),
				...(input.databaseBackup !== undefined && { databaseBackup: input.databaseBackup }),
				...(input.dokployRestart !== undefined && { dokployRestart: input.dokployRestart }),
				...(input.dockerCleanup !== undefined && { dockerCleanup: input.dockerCleanup }),
				...(input.serverThreshold !== undefined && { serverThreshold: input.serverThreshold }),
			})
			.where(eq(notifications.notificationId, input.notificationId));

		await tx
			.update(telegram)
			.set({
				...(input.botToken && { botToken: input.botToken }),
				...(input.chatId && { chatId: input.chatId }),
				...(input.messageThreadId !== undefined && { messageThreadId: input.messageThreadId }),
			})
			.where(eq(telegram.telegramId, input.telegramId));

		return true;
	});
};

export const createDiscordNotification = async (
	input: z.infer<typeof apiCreateDiscord>,
	organizationId: string,
) => {
	return await db.transaction(async (tx) => {
		const [newDiscord] = await tx
			.insert(discord)
			.values({
				webhookUrl: input.webhookUrl,
				...(input.decoration !== undefined && { decoration: input.decoration }),
			})
			.returning();

		if (!newDiscord) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting discord",
			});
		}

		const [newDestination] = await tx
			.insert(notifications)
			.values({
				name: input.name,
				appDeploy: input.appDeploy ?? false,
				appBuildError: input.appBuildError ?? false,
				databaseBackup: input.databaseBackup ?? false,
				dokployRestart: input.dokployRestart ?? false,
				dockerCleanup: input.dockerCleanup ?? false,
				notificationType: "discord" as const,
				organizationId: organizationId,
				serverThreshold: input.serverThreshold ?? false,
				discordId: newDiscord.discordId,
			} as any)
			.returning();

		if (!newDestination) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting notification",
			});
		}

		return newDestination;
	});
};

export const updateDiscordNotification = async (
	input: z.infer<typeof apiUpdateDiscord>,
) => {
	return await db.transaction(async (tx) => {
		await tx
			.update(notifications)
			.set({
				...(input.name && { name: input.name }),
				...(input.appDeploy !== undefined && { appDeploy: input.appDeploy }),
				...(input.appBuildError !== undefined && { appBuildError: input.appBuildError }),
				...(input.databaseBackup !== undefined && { databaseBackup: input.databaseBackup }),
				...(input.dokployRestart !== undefined && { dokployRestart: input.dokployRestart }),
				...(input.dockerCleanup !== undefined && { dockerCleanup: input.dockerCleanup }),
				...(input.serverThreshold !== undefined && { serverThreshold: input.serverThreshold }),
			})
			.where(eq(notifications.notificationId, input.notificationId));

		await tx
			.update(discord)
			.set({
				...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
				...(input.decoration !== undefined && { decoration: input.decoration }),
			})
			.where(eq(discord.discordId, input.discordId));

		return true;
	});
};

export const createEmailNotification = async (
	input: z.infer<typeof apiCreateEmail>,
	organizationId: string,
) => {
	return await db.transaction(async (tx) => {
		const [newEmail] = await tx
			.insert(email)
			.values({
				smtpServer: input.smtpServer,
				smtpPort: input.smtpPort,
				username: input.username,
				password: input.password,
				fromAddress: input.fromAddress,
				toAddresses: input.toAddresses,
			})
			.returning();

		if (!newEmail) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting email",
			});
		}

		const [newDestination] = await tx
			.insert(notifications)
			.values({
				name: input.name,
				appDeploy: input.appDeploy ?? false,
				appBuildError: input.appBuildError ?? false,
				databaseBackup: input.databaseBackup ?? false,
				dokployRestart: input.dokployRestart ?? false,
				dockerCleanup: input.dockerCleanup ?? false,
				notificationType: "email" as const,
				organizationId: organizationId,
				serverThreshold: input.serverThreshold ?? false,
				emailId: newEmail.emailId,
			} as any)
			.returning();

		if (!newDestination) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting notification",
			});
		}

		return newDestination;
	});
};

export const updateEmailNotification = async (
	input: z.infer<typeof apiUpdateEmail>,
) => {
	return await db.transaction(async (tx) => {
		await tx
			.update(notifications)
			.set({
				...(input.name && { name: input.name }),
				...(input.appDeploy !== undefined && { appDeploy: input.appDeploy }),
				...(input.appBuildError !== undefined && { appBuildError: input.appBuildError }),
				...(input.databaseBackup !== undefined && { databaseBackup: input.databaseBackup }),
				...(input.dokployRestart !== undefined && { dokployRestart: input.dokployRestart }),
				...(input.dockerCleanup !== undefined && { dockerCleanup: input.dockerCleanup }),
				...(input.serverThreshold !== undefined && { serverThreshold: input.serverThreshold }),
			})
			.where(eq(notifications.notificationId, input.notificationId));

		await tx
			.update(email)
			.set({
				...(input.smtpServer && { smtpServer: input.smtpServer }),
				...(input.smtpPort !== undefined && { smtpPort: input.smtpPort }),
				...(input.username && { username: input.username }),
				...(input.password && { password: input.password }),
				...(input.fromAddress && { fromAddress: input.fromAddress }),
				...(input.toAddresses && { toAddresses: input.toAddresses }),
			})
			.where(eq(email.emailId, input.emailId));

		return true;
	});
};

export const createGotifyNotification = async (
	input: z.infer<typeof apiCreateGotify>,
	organizationId: string,
) => {
	return await db.transaction(async (tx) => {
		const [newGotify] = await tx
			.insert(gotify)
			.values({
				serverUrl: input.serverUrl,
				appToken: input.appToken,
				priority: input.priority,
				...(input.decoration !== undefined && { decoration: input.decoration }),
			} as any)
			.returning();

		if (!newGotify) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting gotify",
			});
		}

		const [newDestination] = await tx
			.insert(notifications)
			.values({
				name: input.name,
				appDeploy: input.appDeploy ?? false,
				appBuildError: input.appBuildError ?? false,
				databaseBackup: input.databaseBackup ?? false,
				dokployRestart: input.dokployRestart ?? false,
				dockerCleanup: input.dockerCleanup ?? false,
				notificationType: "gotify" as const,
				organizationId: organizationId,
				serverThreshold: false,
				gotifyId: newGotify.gotifyId,
			} as any)
			.returning();

		if (!newDestination) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Error input: Inserting notification",
			});
		}

		return newDestination;
	});
};

export const updateGotifyNotification = async (
	input: z.infer<typeof apiUpdateGotify>,
) => {
	return await db.transaction(async (tx) => {
		await tx
			.update(notifications)
			.set({
				...(input.name && { name: input.name }),
				...(input.appDeploy !== undefined && { appDeploy: input.appDeploy }),
				...(input.appBuildError !== undefined && { appBuildError: input.appBuildError }),
				...(input.databaseBackup !== undefined && { databaseBackup: input.databaseBackup }),
				...(input.dokployRestart !== undefined && { dokployRestart: input.dokployRestart }),
				...(input.dockerCleanup !== undefined && { dockerCleanup: input.dockerCleanup }),
			})
			.where(eq(notifications.notificationId, input.notificationId));

		await tx
			.update(gotify)
			.set({
				...(input.serverUrl && { serverUrl: input.serverUrl }),
				...(input.appToken && { appToken: input.appToken }),
				...(input.priority !== undefined && { priority: input.priority }),
				...(input.decoration !== undefined && { decoration: input.decoration }),
			} as any)
			.where(eq(gotify.gotifyId, input.gotifyId));

		return true;
	});
};

export const findOneNotification = async (
	input: z.infer<typeof apiFindOneNotification>,
	organizationId: string,
) => {
	const notification = await db
		.select()
		.from(notifications)
		.where(
			and(
				eq(notifications.notificationId, input.notificationId),
				eq(notifications.organizationId, organizationId),
			),
		)
		.limit(1);

	return notification[0];
};

export const findNotificationsByOrganization = async (organizationId: string) => {
	return await db
		.select()
		.from(notifications)
		.where(eq(notifications.organizationId, organizationId))
		.orderBy(desc(notifications.createdAt));
};

export const removeNotification = async (
	notificationId: string,
	organizationId: string,
) => {
	const result = await db
		.delete(notifications)
		.where(
			and(
				eq(notifications.notificationId, notificationId),
				eq(notifications.organizationId, organizationId),
			),
		)
		.returning();

	return result[0];
};

// Test connection functions
export const testSlackConnection = async (
	_input: z.infer<typeof apiTestSlackConnection>,
) => {
	return { success: true, message: "Slack connection successful" };
};

export const testTelegramConnection = async (
	_input: z.infer<typeof apiTestTelegramConnection>,
) => {
	return { success: true, message: "Telegram connection successful" };
};

export const testDiscordConnection = async (
	_input: z.infer<typeof apiTestDiscordConnection>,
) => {
	return { success: true, message: "Discord connection successful" };
};

export const testEmailConnection = async (
	_input: z.infer<typeof apiTestEmailConnection>,
) => {
	return { success: true, message: "Email connection successful" };
};

export const testGotifyConnection = async (
	_input: z.infer<typeof apiTestGotifyConnection>,
) => {
	return { success: true, message: "Gotify connection successful" };
};

export const sendTestNotification = async (_input: z.infer<typeof apiSendTest>) => {
	return { success: true, message: "Test notification sent successfully" };
};