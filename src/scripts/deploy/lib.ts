import chalk from 'chalk';
import { exec } from 'child_process';

export interface IRunOptions {
	silent: boolean;
	verbose: boolean;
}

export interface IRunOutput {
	stdout: string;
	stderr: string;
}

export enum Pm2Status {
	ONLINE = 'online',
	STOPPING = 'stopping',
	STOPPED = 'stopped',
	LAUNCHING = 'launching',
	ERRORED = 'errored',
	ONE_LAUNCH_STATUS = 'one-launch-status',
}

export interface IPm2Process {
	name: string;
	pid: number;
	status: Pm2Status;
}

export interface IHelpFlagMap {
	[x: string]: string;
}

/**
 * Runs a shell command, returning the outputs.
 *
 * Throws if failing to run the command.
 *
 * @param command Command to run
 * @param userOptions Optional run options
 */
export async function run(command: string, userOptions: Partial<IRunOptions> = {}): Promise<IRunOutput> {
	return new Promise<IRunOutput>((resolve, reject) => {
		// provide option defaults
		const options: Required<IRunOptions> = {
			silent: false,
			verbose: false,
			...userOptions,
		};

		// measure time
		const startTime = Date.now();

		// show command to execute if not silent
		if (!options.silent) {
			log(`${chalk.reset.bold(`> ${command}`)}...`);
		}

		// run the command
		exec(command, (error, stdout, stderr) => {
			// calculate time taken
			const timeTaken = Date.now() - startTime;

			// handle error and reject
			if (error !== null) {
				// log failure if not silent
				if (!options.silent) {
					log(
						`${chalk.reset.bold(`> ${command}`)} failed in ${formatDuration(timeTaken)} - ${chalk.bold(
							error.message,
						)}\n`,
						true,
					);
				}

				reject(error);

				return;
			}

			// show outputs if not silent
			if (!options.silent) {
				// pad the outputs
				const paddedStdout = stdout
					.split('\n')
					.map(line => `  ${line}`)
					.join('\n');
				const paddedStderr = stderr
					.split('\n')
					.map(line => `  ${line}`)
					.join('\n');

				log(`${chalk.reset.bold(`> ${command}`)} done in ${formatDuration(timeTaken)}\n`, true);

				if (options.verbose) {
					if (stdout.length > 0) {
						log(chalk.gray(paddedStdout));
					}

					if (stderr.length > 0) {
						log(chalk.yellow(paddedStderr));
					}

					log('\n');
				}
			}

			// resolve with the results
			resolve({
				stdout,
				stderr,
			});
		});
	});
}

/**
 * Returns list of registered pm2 processes.
 */
export async function getPm2Processes(): Promise<IPm2Process[]> {
	const { stdout } = await run('pm2 jlist', { silent: true });
	const list = JSON.parse(stdout) as Array<{ name: string; pid: number; pm2_env: { status: Pm2Status } }>;

	return list.map(item => ({
		name: item.name,
		pid: item.pid,
		status: item.pm2_env.status,
	}));
}

/**
 * Restarts all online pm2 processes.
 */
export async function restartOnlinePm2Processes(): Promise<void> {
	// restart currently online processes
	const allProcesses = await getPm2Processes();
	const onlineProcesses = allProcesses.filter(process => process.status === Pm2Status.ONLINE);

	for (const onlineProcess of onlineProcesses) {
		await run(`pm2 restart ${onlineProcess.name}`);
	}
}

/**
 * Removes last console line.
 */
export function clearLine() {
	process.stdout.write('\r\x1b[K');
}

/**
 * Logs message to console.
 *
 * @param message Message to log
 * @param clearPrevious Should the previous line be cleared
 */
export function log(message: string, clearPrevious = false) {
	if (clearPrevious) {
		clearLine();
	}

	process.stdout.write(message);
}

/**
 * Logs given lines padded with spaces.
 *
 * @param padding Padding length
 * @param lines Lines to log
 */
export function logPadded(padding = 2, ...lines: string[]) {
	const pad = getPad(padding);

	log(lines.map(line => `${pad}${line}`).join('\n'));
	log('\n');
}

/**
 * Formats duration as either in milliseconds or in seconds.
 *
 * @param durationMilliseconds Duration in milliseconds to format
 */
export function formatDuration(durationMilliseconds: number): string {
	if (durationMilliseconds < 1000) {
		return `${durationMilliseconds}ms`;
	}

	// tslint:disable-next-line:no-magic-numbers
	return `${Math.round(durationMilliseconds / 100) / 10}s`;
}

/**
 * Returns whether process arguments contain given flag or one of the flags.
 *
 * @param flag Flag or array of flags to search for
 */
export function gotFlag(flag: string | string[]): boolean {
	const flags = Array.isArray(flag) ? flag : [flag];

	return process.argv.findIndex(arg => flags.indexOf(arg) !== -1) !== -1;
}

/**
 * Returns spaces string padding.
 *
 * @param length Padding length
 */
export function getPad(length: number): string {
	if (length < 1) {
		return '';
	}

	return Array(length + 1).join(' ');
}

/**
 * Shows help information.
 *
 * @param usage Usage description
 * @param flags Map of flags to their meanings
 */
export function showHelp(usage: string, flags: IHelpFlagMap = {}): void {
	const longestFlagLength = Object.keys(flags).reduce(
		(maxLength, flag) => (flag.length > maxLength ? flag.length : maxLength),
		0,
	);

	logPadded(
		2,
		'',
		`Usage: ${usage}`,
		'',
		'Flags:',
		...Object.keys(flags).map(
			// tslint:disable-next-line:no-magic-numbers
			flagName => `  ${flagName}${getPad(longestFlagLength - flagName.length + 4)}${flags[flagName]}`,
		),
		'',
	);
}
