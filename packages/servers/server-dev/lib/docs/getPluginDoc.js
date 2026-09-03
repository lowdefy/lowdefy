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
import { type } from '@lowdefy/helpers';

import resolvePluginDir from './resolvePluginDir.js';

// Local plugins have no doc convention — probe the common locations and
// return whatever markdown ships with the package.
function getPluginDoc({ packageName }) {
  const pluginDir = resolvePluginDir({ packageName });
  if (type.isNone(pluginDir)) {
    return null;
  }
  const sections = [];
  for (const readme of ['README.md', 'readme.md']) {
    const readmePath = path.join(pluginDir, readme);
    if (fs.existsSync(readmePath)) {
      sections.push(fs.readFileSync(readmePath, 'utf8'));
      break;
    }
  }
  for (const docsDir of ['docs', 'dist/docs']) {
    const dirPath = path.join(pluginDir, docsDir);
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    for (const fileName of fs.readdirSync(dirPath).sort()) {
      if (fileName.endsWith('.md')) {
        sections.push(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
      }
    }
  }
  if (sections.length === 0) {
    return null;
  }
  return { package: packageName, markdown: sections.join('\n\n---\n\n') };
}

export default getPluginDoc;
