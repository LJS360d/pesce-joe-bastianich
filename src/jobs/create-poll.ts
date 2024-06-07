import { Client, PollLayoutType, type GuildTextBasedChannel } from 'discord.js';
import Container from 'typedi';
import { Database } from '../database/connect';
import { SubmissionsTable } from '../database/schema/submission';
import { Logger } from 'fonzi2';
import { eq } from 'drizzle-orm';
import { PollsTable } from '../database/schema/poll';

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
				.where(eq(SubmissionsTable.polled, false))
				.execute()
		).map(({ id }) => id)
	);
	if (!channelIds.size) return;
	Logger.info(`Creating submissions poll in ${channelIds.size} channels`);
	const pollChannels = Array.from(client.channels.cache.values()).filter((ch) =>
		channelIds.has(ch.id)
	) as GuildTextBasedChannel[];
	const submissions = await db
		.select()
		.from(SubmissionsTable)
		.where(eq(SubmissionsTable.polled, false))
		.execute();
	for (const channel of pollChannels) {
		const res = await channel.send({
			poll: {
				question: { text: 'Votate il piatto favorito della settimana' },
				answers: submissions.map(({ name, submitter }) => ({
					text: `${name} [${submitter}]`,
				})),
				duration: 12,
				allowMultiselect: false,
				layoutType: PollLayoutType.Default,
			},
		});

		await db
			.insert(PollsTable)
			.values({
				startTime: new Date(),
				endTime: new Date(new Date().getTime() + 12 * 60 * 60 * 1000),
				guildId: channel.guild.id,
				channelId: channel.id,
				messageId: res.id,
			})
			.execute();
	}

	await db.update(SubmissionsTable).set({ polled: true }).execute();
}
