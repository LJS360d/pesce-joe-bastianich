import {
	ApplicationCommandOptionType,
	ChannelType,
	type BaseGuildTextChannel,
	type ChatInputCommandInteraction,
} from 'discord.js';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Command, DiscordHandler, HandlerType, Logger } from 'fonzi2';
import Container from 'typedi';
import { Database } from '../../database/connect';
import { SubmissionsTable } from '../../database/schema/submission';
import ChefService from '../../services/chef.service';
import { SuggestionsTable } from '../../database/schema/suggestions';

export class CommandsHandler extends DiscordHandler {
	public readonly type = HandlerType.commandInteraction;
	readonly db: NodePgDatabase;
	readonly chefService: ChefService;

	constructor(private version: string) {
		super();
		this.db = Container.get(Database).instance;
		this.chefService = Container.get(ChefService);
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
				name: 'name',
				description: 'name/description of the dish',
				type: ApplicationCommandOptionType.String,
			},
		],
	})
	public async onSubmit(interaction: ChatInputCommandInteraction<'cached'>) {
		const name = interaction.options.getString('name');
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
				name: `${submitter}'s Submission - ${name}`,
				type: ChannelType.PublicThread,
			});
			const res = await this.db
				.insert(SubmissionsTable)
				.values({
					name,
					submitter,
					submitterId,
					channel: interaction.channelId,
					thread: thread.id,
				})
				.returning()
				.execute();
			const submissionId = String(res.at(0)?.id ?? '?');
			Logger.info(`Submission added: ${name} [${submissionId}]`);
			await thread.edit({
				name: `${thread.name} [${submissionId}]`,
			});
			thread.send(`<@${submitterId}> submitted: ${name}`);
			// thread.send('Please send a picture of the dish and the ingredients here');
			thread.send(
				'Manda qui un immagine del piatto e la lista degli ingredienti'
			);
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
			Logger.error(JSON.stringify(error));
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

	@Command({
		name: 'suggest',
		description: 'suggests a new dish based on given ingredients',
		options: [
			{
				name: 'ingredients',
				description: 'the ingredients for the dish (free prompt)',
				type: ApplicationCommandOptionType.String,
				required: true,
				maxLength: 255,
			},
		],
	})
	public async onSuggest(interaction: ChatInputCommandInteraction<'cached'>) {
		const prompt = interaction.options.getString('ingredients')!;
		await interaction.deferReply();
		try {
			const suggestion = await this.chefService.getSuggestion(prompt);
			await this.db
				.insert(SuggestionsTable)
				.values({
					prompt,
					result: suggestion,
					user: interaction.user.displayName,
					userId: interaction.user.id,
				})
				.execute();
			await interaction.editReply(`${suggestion}\n\nRichiesta:\n\`${prompt}\``);
			return;
		} catch (error) {
			Logger.error(JSON.stringify(error));
			await interaction.editReply("I couldn't get a suggestion for that");
			return;
		}
	}
}
