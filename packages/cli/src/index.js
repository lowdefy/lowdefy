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
import buildNetlify from './commands/buildNetlify/buildNetlify.js';
import cleanCache from './commands/cleanCache/cleanCache.js';
import dev from './commands/dev/dev.js';
import errorHandler from './utils/errorHandler';

const { description, version } = packageJson;

program.name('lowdefy').description(description).version(version, '-v, --version');

program
  .command('build')
  .description('Build a Lowdefy deployment.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .option(
    '--output-directory <output-directory>',
    'Change the directory to which build artifacts are saved. Default is "<base-directory>/.lowdefy/build".'
  )
  .passCommandToAction(false)
  .action(errorHandler(build));

program
  .command('build-netlify')
  .description('Build a Lowdefy deployment to deply in netlify.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .passCommandToAction(false)
  .action(errorHandler(buildNetlify));

program
  .command('clean-cache')
  .description('Clean cached scripts and block meta descriptions.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .passCommandToAction(false)
  .action(errorHandler(cleanCache));

program
  .command('dev')
  .description('Start a Lowdefy development server.')
  .usage(`[options]`)
  .option(
    '--base-directory <base-directory>',
    'Change base directory. Default is the current working directory.'
  )
  .passCommandToAction(false)
  .action(errorHandler(dev));

program.parse(process.argv);
