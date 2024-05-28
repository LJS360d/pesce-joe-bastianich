import { Logger, getRegisteredCommands } from 'fonzi2';
import { PesceJoeBastianichClient } from './client/client';
import ClientEventsHandler from './client/handlers/client.events.handler';
import { CommandsHandler } from './client/handlers/commands.handler';
import { connectPostgres } from './database/connect';
import env from './env';
import options from './options';

async function main() {
	const db = await connectPostgres(env.POSTGRES_URL);
	const client = new PesceJoeBastianichClient(env.TOKEN, options, [
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
		process.on(signal, async () => {
			Logger.warn(`Received ${signal} signal, shutting down...`);
		});
	});
}

void main();
