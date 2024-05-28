import { Client, type GuildTextBasedChannel } from 'discord.js';
import Container from 'typedi';
import { Database } from '../database/connect';
import { ChannelsTable } from '../database/models/channel';
import { SubmissionsTable } from '../database/models/submission';

export async function createPoll() {
	const client = Container.get(Client<true>);
	const db = Container.get(Database).instance;
	const channelIds = (
		await db
			.select({
				id: ChannelsTable.id,
			})
			.from(ChannelsTable)
			.execute()
	).map(({ id }) => id);

	const pollChannels = Array.from(client.channels.cache.values()).filter((ch) =>
		channelIds.includes(ch.id)
	) as GuildTextBasedChannel[];
	const submissions = await db.select().from(SubmissionsTable).execute();
	for (const channel of pollChannels) {
		channel.send({
			poll: {
				question: { text: 'Votate il favorito' },
				answers: submissions.map(({ submitter }) => ({
					text: submitter,
				})),
				duration: 12,
				allowMultiselect: false,
			},
		});
	}
}
