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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { readFile, writeFile } from '@lowdefy/node-utils';

import agentSetup from '../agentSetup/agentSetup.js';
import renderTemplate from './renderTemplate.js';
import resolveAppName from './resolveAppName.js';
import templateFiles from './templateFiles.js';

async function init({ context }) {
  const projectDirectory = context.directories.config;
  const lowdefyFilePath = path.join(projectDirectory, 'lowdefy.yaml');
  if (fs.existsSync(lowdefyFilePath)) {
    throw new Error('Cannot initialize a Lowdefy project, a "lowdefy.yaml" file already exists');
  }
  context.logger.info('Initializing Lowdefy project.');

  const values = {
    APP_NAME: resolveAppName({ directory: projectDirectory }),
    LOWDEFY_VERSION: context.cliVersion,
    BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('hex'),
  };

  for (const { template, target } of templateFiles) {
    const targetPath = path.join(projectDirectory, target);
    // A project can already hold a README or a .gitignore that is not ours;
    // only lowdefy.yaml is guaranteed absent, and that guarantee is above.
    if (fs.existsSync(targetPath)) {
      context.logger.info(`Skipped '${target}', it already exists.`);
      continue;
    }
    const contents = await readFile(
      url.fileURLToPath(new URL(`./templates/${template}`, import.meta.url))
    );
    await writeFile(targetPath, renderTemplate({ template: contents, values }));
    context.logger.info(`Created '${target}'.`);
  }

  await context.sendTelemetry();

  if (context.options.agentSetup === false) {
    context.logger.info({ spin: 'succeed' }, 'Project initialized.');
    return;
  }
  await agentSetup({ context });
  context.logger.info({ spin: 'succeed' }, 'Project initialized.');
}

export default init;
