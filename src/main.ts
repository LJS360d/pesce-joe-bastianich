import { Logger, getRegisteredCommands } from 'fonzi2';
import Container from 'typedi';
import { PesceJoeBastianichClient } from './client/client';
import ClientEventsHandler from './client/handlers/client.events.handler';
import { CommandsHandler } from './client/handlers/commands.handler';
import { Database, connectPostgres } from './database/connect';
import env from './env';
import options from './options';
import { Client } from 'discord.js';
import startCrons from './jobs/cron.jobs';

async function main() {
	const db = await connectPostgres(env.POSTGRES_URL);
	if (!db) {
		process.exit(1);
	}
	Container.set(Database, new Database(db!));
	const client = new PesceJoeBastianichClient(env.TOKEN, options, [
		new CommandsHandler(env.VERSION),
		new ClientEventsHandler(getRegisteredCommands()),
	]);
	Container.set(Client<true>, client);
	await startCrons();
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
