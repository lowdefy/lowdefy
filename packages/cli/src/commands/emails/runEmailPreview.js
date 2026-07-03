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

import fs from 'fs';
import path from 'path';
import { spawnProcess } from '@lowdefy/node-utils';
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

async function runEmailPreview({ context }) {
  const serverDirectory = context.directories.server;
  const emailBin = path.join(
    serverDirectory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'email.cmd' : 'email'
  );

  if (!fs.existsSync(emailBin)) {
    throw new Error(
      'react-email is not installed. It is added to the server when "notifications:" is configured — check your lowdefy.yaml.'
    );
  }

  const port = context.options.port ?? 3001;
  context.logger.info(`Starting the email preview server on port ${port}.`);

  await spawnProcess({
    command: emailBin,
    args: ['dev', '--dir', context.directories.emails, '--port', String(port)],
    stdOutLineHandler: createStdOutLineHandler({ context }),
    processOptions: {
      cwd: serverDirectory,
      shell: process.platform === 'win32',
      env: process.env,
    },
    silent: false,
  });
}

export default runEmailPreview;
