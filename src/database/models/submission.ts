import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const SubmissionsTable = pgTable('submissions', {
	id: serial('id').primaryKey(),
	submitter: text('submitter').notNull(),
	image: text('image').notNull(),
	ingredients: text('ingredients').notNull(),
});
