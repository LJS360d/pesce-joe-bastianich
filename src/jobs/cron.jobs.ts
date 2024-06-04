import { CronJob } from 'cron';
import { createPoll } from './create-poll';
import { Logger } from 'fonzi2';

async function startCrons() {
	/* const thursday0800_createPoll = */ CronJob.from({
		cronTime: '0 8 * * 4',
		onTick: () => {
			Logger.info('createPoll cron ticked');
			createPoll();
		},
		start: true,
		timeZone: 'Europe/Rome',
	});
	// TODO add container DI for ServerSide monitoring
	// Container.set(, thursday0800_createPoll, "")
}

export default startCrons;
