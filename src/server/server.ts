import type { Client } from 'discord.js';
import express, { type Request, type Response } from 'express';
import { Fonzi2Server, type ServerController } from 'fonzi2';
import { resolve } from 'node:path';
import 'reflect-metadata';
import { render } from './render/render';
export class StarterKitServer extends Fonzi2Server {
	constructor(client: Client<true>, controllers: ServerController[]) {
		super(client, controllers);
		this.app.use(express.static(resolve(process.cwd(), 'public')));
		this.app.set('views', [
			this.app.get('views'),
			resolve(process.cwd(), 'views'),
		]);
	}

	override start(): void {
		/* this.httpServer.on('request', (req, res) => {
			Logger.trace(`[${req.method}] ${req.url} ${res.statusCode}`);
		}); */
		super.start();
	}

	override async dashboard(req: Request, res: Response) {
		const userInfo = this.getSessionUserInfo(req);
		const props = {
			client: this.client,
			guilds: this.client.guilds.cache,
			startTime: this.startTime,
			userInfo,
		};
		const options = {
			userInfo,
		};
		const content = await render('dashboard', props, options);
		res.status(200).send(content);
		return;
	}
}
