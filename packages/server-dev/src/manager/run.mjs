#!/usr/bin/env node
/*
  Copyright 2020-2021 Lowdefy, Inc

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

import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { writeFile } from '@lowdefy/node-utils';

import startServer from './startServer.mjs';

const argv = yargs(hideBin(process.argv)).argv;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tick = async () => {
  const filePath = path.resolve('./build/tick.json');
  console.log(filePath);
  for (let i = 0; i < 10; i++) {
    await sleep(5000);
    console.log('tick', i);
    await writeFile({
      filePath,
      content: JSON.stringify({ tick: i }),
    });
  }
};

async function run() {
  tick();
  await startServer({
    packageManager: argv.packageManager || 'npm',
  });
}

run();
