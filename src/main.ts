import { Logger, getRegisteredCommands } from 'fonzi2';
import { StarterKitClient } from './client/client';
import env from './env';
import ClientEventsHandler from './client/handlers/client.events.handler';
import { CommandsHandler } from './client/handlers/commands.handler';
import { MessageHandler } from './client/handlers/message.handler';
import options from './options';

async function main() {
	new StarterKitClient(env.TOKEN, options, [
		new MessageHandler(),
		new CommandsHandler(env.VERSION),
		new ClientEventsHandler(getRegisteredCommands()),
	]);

	process.on('uncaughtException', (err: any) => {
		Logger.error(
			`${err.name} - ${err.message}\n${err.stack || 'No stack trace available'}`
		);
	});

	process.on('unhandledRejection', (reason: any) => {
		if (reason?.status === 429) return;
		if (reason?.response?.status === 429) return;
		Logger.error(reason);
	});

	['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
		process.on(signal, () => {
			Logger.warn(`Received ${String(signal)} signal`);
		});
	});
}

void main();
