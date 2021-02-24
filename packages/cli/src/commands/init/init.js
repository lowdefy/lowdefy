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
import fse from 'fs-extra';
import { writeFile } from '@lowdefy/node-utils';

import startUp from '../../utils/startUp';
import lowdefyFile from './lowdefyFile';

async function init({ context, options }) {
  await startUp({ context, options, command: 'init', lowdefyFileNotRequired: true });
  const lowdefyFilePath = path.resolve('./lowdefy.yaml');
  const fileExists = fse.existsSync(lowdefyFilePath);
  if (fileExists) {
    throw new Error('Cannot initialize a Lowdefy project, a "lowdefy.yaml" file already exists');
  }
  context.print.log(`Initializing Lowdefy project`);
  await writeFile({ filePath: lowdefyFilePath, content: lowdefyFile });
  context.print.log(`Created 'lowdefy.yaml'.`);
  await writeFile({
    filePath: path.resolve('./.gitignore'),
    content: `.lowdefy/**
.env`,
  });
  context.print.log(`Created '.gitignore'.`);
  await context.sendTelemetry();
  context.print.succeed(`Project initialized.`);
}

export default init;
