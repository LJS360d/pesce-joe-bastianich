import type { ApplicationCommandData } from 'discord.js';
import { ClientEvent, DiscordHandler, HandlerType, Logger } from 'fonzi2';
import { HxController } from '../../server/controllers/hx.controller';
import { PagesController } from '../../server/controllers/pages.controller';
import { StarterKitServer } from '../../server/server';

export default class ClientEventsHandler extends DiscordHandler {
	public readonly type = HandlerType.clientEvent;

	constructor(private commands: ApplicationCommandData[]) {
		super();
	}

	@ClientEvent('ready')
	async onReady() {
		// * Successful login
		Logger.info(`Logged in as ${this.client?.user?.tag}!`);

		const loading = Logger.loading(
			'Started refreshing application (/) commands.'
		);
		try {
			await this.client?.application?.commands.set(this.commands);
			loading.success('Successfully reloaded application (/) commands.');
			new StarterKitServer(this.client, [
				new PagesController(),
				new HxController(),
			]).start();
		} catch (err: any) {
			loading.fail('Failed to reload application (/) commands.');
			Logger.error(err);
			process.exit(1);
		}
	}
}
