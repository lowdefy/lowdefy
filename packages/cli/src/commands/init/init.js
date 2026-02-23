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

import path from 'path';
import fs from 'fs';
import { writeFile } from '@lowdefy/node-utils';

import lowdefyFile from './lowdefyFile.js';

async function init({ context }) {
  const lowdefyFilePath = path.resolve('./lowdefy.yaml');
  const fileExists = fs.existsSync(lowdefyFilePath);
  if (fileExists) {
    throw new Error('Cannot initialize a Lowdefy project, a "lowdefy.yaml" file already exists');
  }
  context.logger.info('Initializing Lowdefy project.');
  await writeFile(lowdefyFilePath, lowdefyFile({ version: context.cliVersion }));
  context.logger.info("Created 'lowdefy.yaml'.");
  await writeFile(
    path.resolve('./.gitignore'),
    `.lowdefy/**
.env`
  );
  context.logger.info("Created '.gitignore'.");
  await context.sendTelemetry();
  context.logger.info({ succeed: true }, 'Project initialized.');
}

export default init;
