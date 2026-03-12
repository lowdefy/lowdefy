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
import YAML from 'yaml';

function collectStrings(obj, strings) {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') strings.push(obj);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectStrings(item, strings);
    return;
  }
  for (const value of Object.values(obj)) {
    collectStrings(value, strings);
  }
}

async function updatePageTailwindCss({ changedFiles, context }) {
  let contentWritten = false;

  changedFiles
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .forEach((f) => {
      try {
        const content = fs.readFileSync(
          path.join(context.directories.config, f),
          'utf8'
        );
        const doc = YAML.parse(content);

        const pageId = path.basename(f, path.extname(f));
        const allStrings = [];
        collectStrings(doc, allStrings);
        if (allStrings.length > 0) {
          const contentPath = path.join(
            context.directories.server,
            'lowdefy-build',
            'tailwind',
            `${pageId}.html`
          );
          fs.mkdirSync(path.dirname(contentPath), { recursive: true });
          fs.writeFileSync(contentPath, allStrings.join('\n'));
          contentWritten = true;
        }
      } catch {
        // YAML parse error — skip
      }
    });

  if (contentWritten) {
    await context.compileCss();
  }
}

export default updatePageTailwindCss;
