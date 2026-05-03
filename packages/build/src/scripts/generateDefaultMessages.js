#!/usr/bin/env node
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
import { writeFile } from '@lowdefy/node-utils';

import defaultPackages from '../defaultPackages.js';

async function generateDefaultMessagesMap() {
  const defaultMessagesMap = {};

  for (const packageName of defaultPackages) {
    let messagesModule;
    try {
      messagesModule = await import(`${packageName}/messages`);
    } catch (e) {
      // Plugin does not ship a `./messages` export — skip silently.
      continue;
    }
    const messages = messagesModule.default ?? messagesModule;
    if (!messages || typeof messages !== 'object') continue;
    defaultMessagesMap[packageName] = messages;
  }

  await writeFile(
    path.resolve(process.cwd(), './dist/defaultMessagesMap.js'),
    `const defaultMessagesMap = ${JSON.stringify(defaultMessagesMap, null, 2)};

export default defaultMessagesMap;
`
  );
}

generateDefaultMessagesMap();
