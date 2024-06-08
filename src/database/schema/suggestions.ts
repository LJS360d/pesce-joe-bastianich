import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const SuggestionsTable = pgTable('suggestions', {
	id: serial('id').primaryKey(),
	prompt: text('prompt').notNull(),
	result: text('result').notNull(),
	user: text('user').notNull(),
	userId: text('channel').notNull(),
});
