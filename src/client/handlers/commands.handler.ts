import type { ChatInputCommandInteraction } from 'discord.js';
import { Command, DiscordHandler, HandlerType } from 'fonzi2';

export class CommandsHandler extends DiscordHandler {
	public readonly type = HandlerType.commandInteraction;

	constructor(private version: string) {
		super();
	}

	@Command({ name: 'version', description: 'returns the application version' })
	public async onVersion(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.reply(this.version);
	}
}
