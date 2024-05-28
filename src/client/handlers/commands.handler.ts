import {
	ApplicationCommandOptionType,
	ChannelType,
	type BaseGuildTextChannel,
	type ChatInputCommandInteraction,
} from 'discord.js';
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
		description: 'returns the application version',
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
		const submitter = interaction.user.displayName;
		const thread = await (
			interaction.channel as BaseGuildTextChannel
		).threads.create({
			name: `Dish submission - ${submitter}`,
			type: ChannelType.PublicThread,
		});
		await thread.send(image);
		await thread.send(ingredients);
		try {
			await this.db
				.insert(SubmissionsTable)
				.values({
					image,
					ingredients,
					submitter,
				})
				.execute();
		} catch (error) {
			console.error(error);
		}
		await interaction.reply({ content: 'Submission added!', ephemeral: true });
	}
}
