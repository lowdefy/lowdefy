/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { createRequire } from 'module';
import { Command, Option } from 'commander';

import agentSetup from './commands/agentSetup/agentSetup.js';
import build from './commands/build/build.js';
import dev from './commands/dev/dev.js';
import dockerOutput from './commands/dockerOutput/dockerOutput.js';
import emails from './commands/emails/emails.js';
import hubLogs from './commands/hub/hubLogs.js';
import hubServe from './commands/hub/hubServe.js';
import hubStart from './commands/hub/hubStart.js';
import hubStatus from './commands/hub/hubStatus.js';
import hubStop from './commands/hub/hubStop.js';
import init from './commands/init/init.js';
import initDocker from './commands/init-docker/initDocker.js';
import initVercel from './commands/init-vercel/initVercel.js';
import mcp from './commands/mcp/mcp.js';
import start from './commands/start/start.js';
import test from './commands/test/test.js';
import upgrade from './commands/upgrade/upgrade.js';
import vercelOutput from './commands/vercelOutput/vercelOutput.js';
import runCommand from './utils/runCommand.js';
import runHubCommand from './utils/runHubCommand.js';

const require = createRequire(import.meta.url);

const packageJson = require('../package.json');
const { description, version: cliVersion } = packageJson;

const program = new Command();

program.name('lowdefy').description(description).version(cliVersion, '-v, --version');

const options = {
  configDirectory: new Option(
    '--config-directory <config-directory>',
    'Change config directory. Default is the current working directory.'
  ).env('LOWDEFY_DIRECTORY_CONFIG'),
  devDirectory: new Option(
    '--dev-directory <dev-directory>',
    'Change the development server directory. Default is "<config-directory>/.lowdefy/dev".'
  ).env('LOWDEFY_DIRECTORY_DEV'),
  disableTelemetry: new Option('--disable-telemetry', 'Disable telemetry.').env(
    'LOWDEFY_DISABLE_TELEMETRY'
  ),
  logLevel: new Option(
    '--log-level <level>',
    'The minimum severity of logs to show in the CLI output.'
  )
    .choices(['error', 'warn', 'info', 'debug'])
    .default('info')
    .env('LOWDEFY_LOG_LEVEL'),
  mockUser: new Option(
    '--mock-user [user]',
    'Start the dev server authenticated as a mock user (auth.dev.mockUser). Pass a JSON user object to set identity/roles, e.g. \'{"sub":"dev","roles":["admin"]}\'. Bare flag uses a default roleless user. Dev only.'
  ).env('LOWDEFY_DEV_USER'),
  port: new Option(
    '--port <port>',
    'Change the port the development server is hosted at. Default is 3000.'
  ).env('PORT'),
  projectDirectory: new Option(
    '--project-directory <project-directory>',
    'Change the directory where agent files (.mcp.json, AGENTS.md, Claude Code skill) are written. Default is the nearest ancestor directory containing .git, falling back to the config directory.'
  ).env('LOWDEFY_DIRECTORY_PROJECT'),
  refResolver: new Option(
    '--ref-resolver <ref-resolver-function-path>',
    'Path to a JavaScript file containing a _ref resolver function to be used as the app default _ref resolver.'
  ),
  serverDirectory: new Option(
    '--server-directory <server-directory>',
    'Change the server directory. Default is "<config-directory>/.lowdefy/server".'
  ).env('LOWDEFY_DIRECTORY_SERVER'),
  watch: new Option(
    '--watch <paths...>',
    'A list of paths to files or directories that should be watched for changes. Globs are supported. Specify each path to watch separated by spaces.'
  ),
  watchIgnore: new Option(
    '--watch-ignore <paths...>',
    'A list of paths to files or directories that should be ignored by the file watcher. Globs are supported. Specify each path to watch separated by spaces.'
  ),
};

program
  .command('agent-setup')
  .description(
    'Set up this project for AI coding agents (.mcp.json, AGENTS.md, Claude Code skill).'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.projectDirectory)
  .action(runCommand({ cliVersion, handler: agentSetup }));

program
  .command('build')
  .description('Build a Lowdefy production app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .option('--no-client-build', 'Do not run the Vite client build.')
  .addOption(new Option('--no-next-build', 'Deprecated alias of --no-client-build.').hideHelp())
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--server <server>',
      'Server package variant. Use "e2e" for @lowdefy/server-e2e.'
    ).choices(['e2e'])
  )
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: build }));

program
  .command('dev')
  .description('Start a Lowdefy development server.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.mockUser)
  .option('--no-open', 'Do not open a new tab in the default browser.')
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(options.watch)
  .addOption(options.watchIgnore)
  .action(runCommand({ cliVersion, handler: dev }));

program
  .command('emails')
  .description('Preview notification emails with the React Email preview server.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--port <port>',
      'Change the port the email preview server is hosted at. Default is 3001.'
    ).env('PORT')
  )
  .addOption(options.refResolver)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: emails }));

program
  .command('docker-output')
  .description('Assemble a minimal Docker runtime (.lowdefy/docker) from a built app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: dockerOutput }));

const hub = program
  .command('hub')
  .description(
    'Manage the Lowdefy hub, the per-user process that runs dev servers for coding agents.'
  );

hub
  .command('status')
  .description('List the dev servers the hub runs.')
  .action(runHubCommand({ cliVersion, handler: hubStatus }));

hub
  .command('start')
  .description('Start (or return) the dev server for an app, run by the hub.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--restart', 'Restart the dev server if it is running.')
  .option('--clean', 'Delete the build directory before starting.')
  .action(runHubCommand({ cliVersion, handler: hubStart }));

hub
  .command('stop')
  .description('Stop a dev server the hub runs. Servers started in a terminal are never stopped.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--all', 'Stop every dev server the hub runs.')
  .action(runHubCommand({ cliVersion, handler: hubStop }));

hub
  .command('logs')
  .description('Print the recent output of a dev server the hub runs.')
  .argument('[directory]', 'The app directory. Default is the current working directory.')
  .option('--lines <lines>', 'How many lines.', '100')
  .option('--grep <text>', 'Only lines containing this text.')
  .action(runHubCommand({ cliVersion, handler: hubLogs }));

hub
  .command('serve', { hidden: true })
  .description('Run the hub in the foreground. Started automatically when needed.')
  .action(runHubCommand({ cliVersion, handler: hubServe }));

program
  .command('init')
  .description('Initialize a Lowdefy project.')
  .usage('[options]')
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: init }));

program
  .command('init-docker')
  .description('Initialize Dockerfile.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: initDocker }));

program
  .command('init-vercel')
  .description('Initialize Vercel deployment installation scripts.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: initVercel }));

program
  .command('mcp')
  .description(
    'Run the Lowdefy MCP server for coding agents over stdio. Agent clients start it from .mcp.json (see `lowdefy agent-setup`).'
  )
  .action(runHubCommand({ cliVersion, handler: mcp }));

program
  .command('vercel-output')
  .description('Assemble a Vercel Build Output (.vercel/output) from a built app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: vercelOutput }));

program
  .command('start')
  .description('Start a Lowdefy production app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: start }));

program
  .command('test')
  .description("Run the app's config tests (tests/journeys/*.yaml).")
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(
    new Option(
      '--filter <name>',
      'Only run tests whose name contains this string (case-insensitive).'
    )
  )
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--url <url>',
      'Run tests against an already running dev server instead of starting one, e.g. http://localhost:3000.'
    )
  )
  .action(runCommand({ cliVersion, handler: test }));

program
  .command('upgrade')
  .description('Upgrade a Lowdefy app to a newer version, applying codemods.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(new Option('--to <version>', 'Target version. Default: latest stable.'))
  .addOption(new Option('--plan', 'Show upgrade plan without executing.'))
  .addOption(new Option('--resume', 'Resume a previously interrupted upgrade.'))
  .action(runCommand({ cliVersion, handler: upgrade }));

export default program;
