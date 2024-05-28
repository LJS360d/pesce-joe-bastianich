import type { Message } from 'discord.js';
import { DiscordHandler, HandlerType, Logger, MessageEvent } from 'fonzi2';

export class MessageHandler extends DiscordHandler {
	public readonly type = HandlerType.messageEvent;

	@MessageEvent('GuildText')
	async onMessage(message: Message<true>) {
		Logger.trace(
			`Message in ${message.guild.name} from ${message.author.displayName}: ${message.content}`
		);
	}
}
