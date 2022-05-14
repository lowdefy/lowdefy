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

import { fileURLToPath } from 'url';
import { readFile } from '@lowdefy/node-utils';

import { Command } from 'commander';

import build from './commands/build/build.js';
import dev from './commands/dev/dev.js';
import init from './commands/init/init.js';
import start from './commands/start/start.js';
import runCommand from './utils/runCommand.js';

const packageJson = JSON.parse(
  await readFile(fileURLToPath(new URL('../package.json', import.meta.url)))
);
const { description, version: cliVersion } = packageJson;

const program = new Command();

program.name('lowdefy').description(description).version(cliVersion, '-v, --version');

program
  .command('build')
  .description('Build a Lowdefy production app.')
  .usage(`[options]`)
  .option(
    '--config-directory <config-directory>',
    'Change config directory. Default is the current working directory.'
  )
  .option('--disable-telemetry', 'Disable telemetry.')
  .option(
    '--output-directory <output-directory>',
    'Change the directory to which build artifacts are saved. Default is "<config-directory>/.lowdefy".'
  )
  .option(
    '--package-manager <package-manager>',
    'The package manager to use. Options are "npm" or "yarn".'
  )
  .option(
    '--ref-resolver <ref-resolver-function-path>',
    'Path to a JavaScript file containing a _ref resolver function to be used as the app default _ref resolver.'
  )
  .option(
    '--server-directory <server-directory>',
    'Change the server directory. Default is "<config-directory>/.lowdefy/server".'
  )
  .action(runCommand({ cliVersion, handler: build }));

program
  .command('dev')
  .description('Start a Lowdefy development server.')
  .usage(`[options]`)
  .option(
    '--config-directory <config-directory>',
    'Change config directory. Default is the current working directory.'
  )
  .option('--disable-telemetry', 'Disable telemetry.')
  .option(
    '--package-manager <package-manager>',
    'The package manager to use. Options are "npm" or "yarn".'
  )
  .option('--port <port>', 'Change the port the development server is hosted at. Default is 3000.')
  .option(
    '--ref-resolver <ref-resolver-function-path>',
    'Path to a JavaScript file containing a _ref resolver function to be used as the app default _ref resolver.'
  )
  .option(
    '--watch <paths...>',
    'A list of paths to files or directories that should be watched for changes. Globs are supported. Specify each path to watch separated by spaces.'
  )
  .option(
    '--watch-ignore <paths...>',
    'A list of paths to files or directories that should be ignored by the file watcher. Globs are supported. Specify each path to watch separated by spaces.'
  )
  .option(
    '--dev-directory <dev-directory>',
    'Change the development server directory. Default is "<config-directory>/.lowdefy/dev".'
  )
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
  .option(
    '--config-directory <config-directory>',
    'Change config directory. Default is the current working directory.'
  )
  .option('--disable-telemetry', 'Disable telemetry.')
  .option(
    '--output-directory <output-directory>',
    'Change the directory to which build artifacts are saved. Default is "<config-directory>/.lowdefy".'
  )
  .option(
    '--package-manager <package-manager>',
    'The package manager to use. Options are "npm" or "yarn".'
  )
  .option('--port <port>', 'Change the port the server is hosted at. Default is 3000.')
  .option(
    '--server-directory <server-directory>',
    'Change the server directory. Default is "<config-directory>/.lowdefy/server".'
  )
  .action(runCommand({ cliVersion, handler: start }));

program.parse(process.argv);
