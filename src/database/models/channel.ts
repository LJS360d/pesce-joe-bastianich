import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

export const ChannelsTable = pgTable('channels', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	active: boolean('active').default(true),
});
