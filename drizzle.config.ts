import { defineConfig } from 'drizzle-kit';
import env from './src/env';

export default defineConfig({
	schema: './src/database/models/*.ts',
	out: './.drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.POSTGRES_URL!,
	},
});
