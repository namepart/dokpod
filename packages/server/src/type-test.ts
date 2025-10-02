// Type testing file to check Drizzle ORM type inference
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
	discord,
	email,
	gotify,
	notifications,
	slack,
	telegram,
} from "./db/schema";

// Test inferred types
export type NotificationInsertType = InferInsertModel<typeof notifications>;
export type NotificationSelectType = InferSelectModel<typeof notifications>;

export type SlackInsertType = InferInsertModel<typeof slack>;
export type SlackSelectType = InferSelectModel<typeof slack>;

export type TelegramInsertType = InferInsertModel<typeof telegram>;
export type TelegramSelectType = InferSelectModel<typeof telegram>;

export type DiscordInsertType = InferInsertModel<typeof discord>;
export type DiscordSelectType = InferSelectModel<typeof discord>;

export type EmailInsertType = InferInsertModel<typeof email>;
export type EmailSelectType = InferSelectModel<typeof email>;

export type GotifyInsertType = InferInsertModel<typeof gotify>;
export type GotifySelectType = InferSelectModel<typeof gotify>;

// Test what fields are actually allowed
function testNotificationInsert(data: NotificationInsertType) {
	// This should show which fields are required/optional
	console.log(data);
}

// Example usage to see type structure
const testSlack: SlackInsertType = {
	webhookUrl: "test",
	// channel is optional
};

const testNotification: NotificationInsertType = {
	name: "test",
	notificationType: "slack",
	organizationId: "test",
	// Should show which foreign key fields are available
};

console.log("Types compiled successfully");
