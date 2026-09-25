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

import fs from 'node:fs';
import path from 'node:path';
import { serializer, type } from '@lowdefy/helpers';

import createIconContext from '../icons/createIconContext.js';

async function loadJitIconContext({ context }) {
  // The skeleton build validated theme.icons and wrote it with its defaults.
  const themePath = path.join(context.directories.build, 'theme.json');
  const theme = serializer.deserialize(JSON.parse(await fs.promises.readFile(themePath, 'utf8')));
  return createIconContext({ context, iconsConfig: theme.icons });
}

// JIT page builds run in the dev server process, with a build context rebuilt
// from artifacts, so the icon sets are loaded once per context. The promise
// is cached so concurrent page builds share one load.
function getJitIconContext({ context }) {
  if (!type.isNone(context.icons)) {
    return Promise.resolve(context.icons);
  }
  if (type.isNone(context.iconContextPromise)) {
    context.iconContextPromise = loadJitIconContext({ context });
  }
  return context.iconContextPromise;
}

export default getJitIconContext;
