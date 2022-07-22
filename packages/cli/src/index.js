#!/usr/bin/env node
/*
  Copyright 2020-2022 Lowdefy, Inc

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

import build from './commands/build/build.js';
import dev from './commands/dev/dev.js';
import init from './commands/init/init.js';
import start from './commands/start/start.js';
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
  disableTelemetry: new Option('--disable-telemetry', 'Disable telemetry.'),
  packageManager: new Option('--package-manager <package-manager>', 'The package manager to use.')
    .env('LOWDEFY_PACKAGE_MANAGER')
    .choices(['npm', 'yarn']),
  // TODO: Env variable?
  port: new Option(
    '--port <port>',
    'Change the port the development server is hosted at. Default is 3000.'
  ),
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
  .command('build')
  .description('Build a Lowdefy production app.')
  .usage(`[options]`)
  .addOption(options.configDirectory)
  .addOption(options.disableTelemetry)
  .option('--no-next-build', 'Do not build the Next.js server.')
  .addOption(options.packageManager)
  .addOption(options.refResolver)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: build }));

program
  .command('dev')
  .description('Start a Lowdefy development server.')
  .usage(`[options]`)
  .addOption(options.configDirectory)
  .addOption(options.devDirectory)
  .addOption(options.disableTelemetry)
  .option('--no-open', 'Do not open a new tab in the default browser.')
  .addOption(options.packageManager)
  .addOption(options.port)
  .addOption(options.refResolver)
  .addOption(options.watch)
  .addOption(options.watchIgnore)
  .action(runCommand({ cliVersion, handler: dev }));

program
  .command('init')
  .description('Initialize a Lowdefy project.')
  .usage(`[options]`)
  .action(runCommand({ cliVersion, handler: init }));

program
  .command('start')
  .description('Start a Lowdefy production app.')
  .usage(`[options]`)
  .addOption(options.disableTelemetry)
  .addOption(options.packageManager)
  .addOption(options.port)
  .addOption(options.serverDirectory)
  .action(runCommand({ cliVersion, handler: start }));

program.parse(process.argv);
