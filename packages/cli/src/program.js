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
import check from './commands/check/check.js';
import dev from './commands/dev/dev.js';
import dockerOutput from './commands/dockerOutput/dockerOutput.js';
import emails from './commands/emails/emails.js';
import expand from './commands/expand/expand.js';
import init from './commands/init/init.js';
import initDocker from './commands/init-docker/initDocker.js';
import initMigrations from './commands/init-migrations/initMigrations.js';
import initVercel from './commands/init-vercel/initVercel.js';
import journeysCompile from './commands/journeys/journeysCompile.js';
import journeysCoverage from './commands/journeys/journeysCoverage.js';
import modulesUpdate from './commands/modules/modulesUpdate.js';
import snapshot from './commands/snapshot/snapshot.js';
import migrate from './commands/migrate/migrate.js';
import start from './commands/start/start.js';
import test from './commands/test/test.js';
import upgrade from './commands/upgrade/upgrade.js';
import vercelOutput from './commands/vercelOutput/vercelOutput.js';
import runCommand from './utils/runCommand.js';

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
    'Set up this project for AI coding agents (.mcp.json, AGENTS.md, Claude Code skills and hooks).'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.port)
  .addOption(options.projectDirectory)
  .option(
    '--skills <names>',
    'Comma-separated Lowdefy topic skills to install into .claude/skills/ alongside lowdefy-config, e.g. "lowdefy-list-pages,lowdefy-filters". Use "all" (default) or "none".',
    'all'
  )
  .option(
    '--force-skills',
    'Overwrite skills already in .claude/skills/ with the versions shipped by this CLI, discarding local edits.'
  )
  .option(
    '--git-hooks',
    'Also install a pre-commit hook that runs "lowdefy check" and the journeys covering the pages the staged files touch.'
  )
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
  .command('check')
  .description('Validate a Lowdefy app against production rules without building it.')
  .usage('[options]')
  .option(
    '--against <ref>',
    'Also report ids and migrations that collide with the given git ref, relative to the merge base.'
  )
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .option('--json', 'Print the { errors, warnings } report as JSON and nothing else.')
  .addOption(options.logLevel)
  .addOption(options.refResolver)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: check }));

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
  .command('expand <pageId>')
  .description(
    'Write a built page out as ordinary config (pages/<pageId>.yaml) — the way out of a page archetype.'
  )
  .usage('<pageId> [options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .option('--output <path>', 'Write the expanded page here instead of pages/<pageId>.yaml.')
  .addOption(options.serverDirectory)
  .option('--yes', 'Overwrite an existing file without asking.')
  .action(runCommand({ cliVersion, handler: expand }));

program
  .command('docker-output')
  .description('Assemble a minimal Docker runtime (.lowdefy/docker) from a built app.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: dockerOutput }));

program
  .command('init')
  .description('Initialize a Lowdefy project.')
  .usage('[options]')
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.port)
  .option('--no-agent-setup', 'Do not run "lowdefy agent-setup" on the new project.')
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
  .command('init-migrations')
  .description(
    'Write per-stage GitHub Actions workflows that dry-run migrations on pull requests and apply them on push, plus an empty ledger per stage.'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .option(
    '--stages <names>',
    'Comma-separated stages to generate workflows for. Each becomes a GitHub environment name and a ledger file .lowdefy/migrations/<stage>.json.',
    'dev,prod'
  )
  .action(runCommand({ cliVersion, handler: initMigrations }));

program
  .command('init-vercel')
  .description('Initialize Vercel deployment installation scripts.')
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: initVercel }));

const journeys = program
  .command('journeys')
  .description('Work with the journeys the app recorded in production.');

journeys
  .command('compile <trace>')
  .description(
    'Compile a recorded trace (JSONL) into candidate journeys, one per distinct session sequence.'
  )
  .usage('<trace> [options]')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .option('--out <path>', 'Write the candidates here instead of tests/journeys/_candidates.')
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: journeysCompile }));

journeys
  .command('coverage <trace>')
  .description(
    'Report the share of the (page, block, event) triples in a recorded trace that a committed journey exercises.'
  )
  .usage('<trace> [options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .action(runCommand({ cliVersion, handler: journeysCoverage }));

const modules = program.command('modules').description('Manage Lowdefy modules.');

modules
  .command('update [name]')
  .description('Refetch GitHub module refs and rewrite lowdefy-modules.lock.yaml.')
  .usage('[name] [options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: modulesUpdate }));

program
  .command('migrate')
  .description(
    'Run pending database migrations (migrations/*.yaml) against the app database and record them in the stage ledger.'
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .option(
    '--stage <name>',
    'The environment whose ledger (.lowdefy/migrations/<stage>.json) to read and write. Defaults to STAGE from the environment, then "local".'
  )
  .option('--dry-run', 'List the migrations that would run, in order, without applying anything.')
  .addOption(new Option('--to <id>', 'Apply pending migrations up to and including this id.'))
  .option('--yes', 'Skip the confirmation prompt (required in non-interactive environments).')
  .option(
    '--allow-checksum-mismatch',
    'Proceed when an applied migration file has changed since it was applied (use only for a known no-op edit).'
  )
  .option('--json', 'Print the run report as JSON and nothing else.')
  .addOption(options.logLevel)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: migrate }));

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
  .command('snapshot')
  .description(
    'Capture or check golden snapshots (screenshot, DOM and state) of pages as dev users, written to snapshots/<pageId>/<user>/.'
  )
  .usage('(--check | --update) [options]')
  .option('--check', 'Compare against the committed snapshots and exit 1 on any drift.')
  .option('--update', 'Write (or overwrite) the committed snapshots.')
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .addOption(options.logLevel)
  .addOption(
    new Option(
      '--pages <pageIds>',
      'Comma-separated page ids to snapshot; defaults to every page in tests/snapshots.yaml, or every page.'
    )
  )
  .addOption(
    new Option(
      '--pixel-tolerance <fraction>',
      'Fraction of changed pixels above which a screenshot counts as drift. Default is 0.001.'
    )
  )
  .option(
    '--fail-on-pixel',
    'Fail --check on screenshot drift too. Only for a pinned rendering container; pixel drift is advisory by default.'
  )
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(
    new Option(
      '--users <names>',
      'Comma-separated auth.dev.users names to snapshot as; defaults to every declared dev user.'
    )
  )
  .addOption(
    new Option(
      '--url <url>',
      'Capture from an already running dev server instead of starting one, e.g. http://localhost:3000.'
    )
  )
  .action(runCommand({ cliVersion, handler: snapshot }));

program
  .command('test')
  .description(
    "Run the app's config tests: journeys (tests/journeys/*.yaml) and request tests (tests/requests/*.test.yaml)."
  )
  .usage('[options]')
  .addOption(options.configDirectory)
  .addOption(
    new Option(
      '--coverage',
      'Report journey coverage of the config the app declares, and write .lowdefy/test/journeyIndex.json.'
    )
  )
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
      '--update',
      'Fill every journey expectation written with a state path and no value from the state the run observes, and write it back to the journey file.'
    )
  )
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
