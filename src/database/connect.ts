import { Client } from 'pg';
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Logger } from 'fonzi2';

export async function connectPostgres(
	url: string
): Promise<NodePgDatabase | undefined> {
	const load = Logger.loading('Connecting to Postgres...');
	try {
		const pgClient = new Client({
			connectionString: url,
		});
		await pgClient.connect();
		const db = drizzle(pgClient);
		load.success('Connected to Postgres Database!');
		return db;
	} catch (error) {
		load.fail('Failed to connect to Postgres');
		return;
	}
}

export class Database {
	constructor(public instance: NodePgDatabase) {}
}
