import chalk from 'chalk';
import { formatDuration, gotFlag, log, restartOnlinePm2Processes, run, showHelp } from './lib';

/**
 * Deploys the application.
 *
 * To make this script run every minute:
 * - add `"deploy": "cross-env NODE_ENV=production ts-node src/scripts/deploy"` script to package.json
 * - run `crontab -e` to edit cron jobs
 * - paste `* * * * * sudo runuser -l centos -c 'cd ~/www && yarn deploy'` to the end of the file
 *
 * Monitoring:
 * - `pm2 logs --lines 200` to show pm2 logs
 * - `tail -f /var/spool/mail/centos` to watch the emails sent by cron
 */
(async () => {
	// show help if requested
	const isHelpRequested = gotFlag(['-h', '--help']);

	if (isHelpRequested) {
		showHelp('yarn deploy [flags]', {
			'-h, --help': 'show help',
			'-f, --force': 'force all steps even if up to date',
		});

		return;
	}

	// measure time and pull changes
	const startTime = Date.now();
	const isForceRequested = gotFlag(['-f', '--force']);
	const pullResult = await run('git pull');

	// stop early if already up to date and not forced
	if (!isForceRequested && pullResult.stdout.indexOf('Already up-to-date') !== -1) {
		log(`\n${chalk.black.bgGreen(` ALREADY UP TO DATE `)}\n\n`);

		return;
	}

	// run deploy commands
	await run('yarn install');
	await run('yarn build');

	// restart running pm2 processes
	await restartOnlinePm2Processes();

	// log result
	log(`\n${chalk.black.bgGreen(` DEPLOY COMPLETE `)} in ${formatDuration(Date.now() - startTime)}\n\n`);
})().catch(e => console.error('\n', e));
