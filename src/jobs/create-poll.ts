import { Client, type GuildTextBasedChannel } from 'discord.js';
import Container from 'typedi';
import { Database } from '../database/connect';
import { SubmissionsTable } from '../database/models/submission';
import { Logger } from 'fonzi2';

export async function createPoll() {
	const client = Container.get(Client<true>);
	const db = Container.get(Database).instance;
	const channelIds = new Set(
		(
			await db
				.select({
					id: SubmissionsTable.channel,
				})
				.from(SubmissionsTable)
				.execute()
		).map(({ id }) => id)
	);
	if (!channelIds.size) return;
	Logger.info(`Creating submissions poll in ${channelIds.size} channels`);
	const pollChannels = Array.from(client.channels.cache.values()).filter((ch) =>
		channelIds.has(ch.id)
	) as GuildTextBasedChannel[];
	const submissions = await db.select().from(SubmissionsTable).execute();
	for (const channel of pollChannels) {
		channel.send({
			poll: {
				question: { text: 'Votate il piatto favorito della settimana' },
				answers: submissions.map(({ id, submitter }) => ({
					text: `${submitter} [${id}]`,
				})),
				duration: 12,
				allowMultiselect: false,
			},
		});

		// Delete all rows in the table
		await db.delete(SubmissionsTable);
	}
}
