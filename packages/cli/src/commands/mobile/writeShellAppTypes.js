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
import { writeFileIfChanged } from '@lowdefy/node-utils';

const MARKER = '// Written by lowdefy mobile config from shell.json `plugins`. Do not edit.';

const APP_TYPES = path.join('src', 'plugins', 'appTypes.js');

// A plugin gives native types when its package.json exports "./native".
function hasNative(packageJson) {
  return packageJson.exports?.['./native'] !== undefined;
}

function spreadTypes({ category, natives }) {
  if (natives.length === 0) {
    return '{}';
  }
  const spreads = natives.map(({ index, plugin }) => {
    const typePrefix =
      plugin.typePrefix === undefined ? '' : `, typePrefix: ${JSON.stringify(plugin.typePrefix)}`;
    return `...prefixTypes({ types: plugin${index}.${category}${typePrefix} })`;
  });
  return `{ ${spreads.join(', ')} }`;
}

function createAppTypes({ packages }) {
  const natives = packages
    .map(({ plugin, packageJson }, index) => ({ index, plugin, packageJson }))
    .filter(({ packageJson }) => hasNative(packageJson));
  const lines = [MARKER, ''];
  if (natives.length > 0) {
    natives.forEach(({ index, plugin }) => {
      lines.push(`import * as plugin${index} from ${JSON.stringify(`${plugin.name}/native`)};`);
    });
    lines.push("import prefixTypes from './prefixTypes.js';", '');
  }
  lines.push(
    'export default {',
    `  actions: ${spreadTypes({ category: 'actions', natives })},`,
    `  blocks: ${spreadTypes({ category: 'blocks', natives })},`,
    '};',
    ''
  );
  return lines.join('\n');
}

// Rewrites src/plugins/appTypes.js in the copied shell, which src/plugins/types.js
// registers after the built-in types, to import each plugin's "./native" with
// its typePrefix applied, in the shape the shell's own appTypes.js shows. A
// shell without plugins keeps the file the shell ships, or gets an empty one
// back when an earlier run wrote plugins into it.
async function writeShellAppTypes({ packages, projectDirectory }) {
  const filePath = path.join(projectDirectory, APP_TYPES);
  if (packages.length === 0) {
    const current = fs.existsSync(filePath) ? await fs.promises.readFile(filePath, 'utf8') : '';
    if (!current.startsWith(MARKER)) {
      return;
    }
  }
  await writeFileIfChanged(filePath, createAppTypes({ packages }));
}

export default writeShellAppTypes;
