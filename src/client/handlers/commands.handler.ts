import {
	ApplicationCommandOptionType,
	ChannelType,
	type BaseGuildTextChannel,
	type ChatInputCommandInteraction,
} from 'discord.js';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Command, DiscordHandler, HandlerType } from 'fonzi2';
import Container from 'typedi';
import { Database } from '../../database/connect';
import { SubmissionsTable } from '../../database/models/submission';
import { isImageUrl } from '../../utils/url.utils';

export class CommandsHandler extends DiscordHandler {
	public readonly type = HandlerType.commandInteraction;
	readonly db: NodePgDatabase;

	constructor(private version: string) {
		super();
		this.db = Container.get(Database).instance;
	}

	@Command({ name: 'version', description: 'returns the application version' })
	public async onVersion(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply(this.version);
	}

	@Command({
		name: 'submit',
		description: 'submits a new dish poll option',
		options: [
			{
				name: 'image',
				description: 'the image link',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'ingredients',
				description: 'the recipe ingredients',
				type: ApplicationCommandOptionType.String,
				max_length: 256,
				required: true,
			},
		],
	})
	public async onSubmit(interaction: ChatInputCommandInteraction<'cached'>) {
		const image = interaction.options.getString('image')!;
		if (!isImageUrl(image)) {
			return interaction.reply({
				content: 'The image URL is not valid',
				ephemeral: true,
			});
		}
		const ingredients = interaction.options.getString('ingredients')!;
		const { displayName: submitter, id: submitterId } = interaction.user;
		try {
			const submissions = await this.db
				.select()
				.from(SubmissionsTable)
				.execute();
			if (submissions.length >= 10) {
				await interaction.reply({
					content:
						'Max submissions reached for this week, better luck next time',
					ephemeral: true,
				});
			}

			const thread = await (
				interaction.channel as BaseGuildTextChannel
			).threads.create({
				name: `Dish submission - ${submitter}`,
				type: ChannelType.PublicThread,
			});
			await thread.send(image);
			await thread.send(ingredients);

			const res = await this.db
				.insert(SubmissionsTable)
				.values({
					image,
					ingredients,
					submitter,
					submitterId,
					channel: interaction.channelId,
					thread: thread.id,
				})
				.returning()
				.execute();
			const submissionId = String(res.at(0)?.id ?? '?');
			await thread.edit({
				name: `${thread.name} [${submissionId}]`,
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: 'Submission Failed',
				ephemeral: true,
			});
		}
		await interaction.reply({ content: 'Submission added!', ephemeral: true });
	}

	@Command({
		name: 'unsubmit',
		description: 'removes a submitted poll option',
		options: [
			{
				name: 'id',
				description: 'the submission id [in the thread name]',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	})
	public async onUnsubmit(interaction: ChatInputCommandInteraction<'cached'>) {
		const submissionId = interaction.options.getString('id')!;
		try {
			const deletedSubmissions = await this.db
				.delete(SubmissionsTable)
				.where(sql`${SubmissionsTable.id} = ${submissionId}`)
				.returning()
				.execute();
			const deletedSubmission = deletedSubmissions.at(0);
			if (!deletedSubmission) {
				await interaction.reply({
					content: 'There was no submission with that ID',
					ephemeral: true,
				});
				return;
			}
			const thread = (
				await (
					this.client.channels.cache.find(
						(ch) => ch.id === deletedSubmission.channel
					) as BaseGuildTextChannel | undefined
				)?.threads.fetchActive(true)
			)?.threads.find((th) => th.id === deletedSubmission.thread);
			if (!thread) {
				await interaction.reply({
					content:
						'Submission deleted from DB but could not find related thread',
					ephemeral: true,
				});
				return;
			}
			await thread.delete(`Unsubmitted by ${interaction.user.displayName}`);
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: 'Submission removal Failed',
				ephemeral: true,
			});
			return;
		}
		await interaction.reply({
			content: 'Submission removed!',
			ephemeral: true,
		});
	}
}
