import { defineConfig } from 'drizzle-kit';
import env from './src/env';

export default defineConfig({
	schema: './src/database/schema/*.ts',
	out: './.drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.POSTGRES_URL!,
	},
});
