import { boolean, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const SubmissionsTable = pgTable('submissions', {
	id: serial('id').primaryKey(),
	submitterId: text('submitterId').notNull(),
	submitter: text('submitter').notNull(),
	channel: text('channel').notNull(),
	thread: text('thread').notNull(),
	name: text('name'),
	polled: boolean('polled').default(false),
});
