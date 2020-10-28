/*
  Copyright 2020 Lowdefy, Inc

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

import program from 'commander';
import packageJson from '../package.json';
import build from './commands/build/build.js';
import cleanCache from './commands/cleanCache/cleanCache.js';
import errorHandler from './utils/errorHandler';

const { description, version } = packageJson;

program.description(description).version(version, '-v, --version');

program
  .command('build')
  .description('Build a Lowdefy deployment.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .action(errorHandler(build));

program
  .command('clean-cache')
  .description('Clean cached scripts and block meta descriptions.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .action(errorHandler(cleanCache));

program.parse(process.argv);
