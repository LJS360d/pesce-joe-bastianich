import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const PollsTable = pgTable('polls', {
	id: serial('id').primaryKey(),
	messageId: text('messageId').notNull(),
	startTime: timestamp('startTime').notNull(),
	endTime: timestamp('endTime').notNull(),
	guildId: text('guildId').notNull(),
	channelId: text('channelId').notNull(),
});
