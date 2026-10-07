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

function listMarkdownFiles({ dir }) {
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => path.join(dir, fileName));
}

// The markdown a plugin or module ships: its README, and the files in docs/
// (a plugin that builds its docs may only have dist/docs/).
function listPackageDocFiles({ dir }) {
  let readme = null;
  for (const fileName of ['README.md', 'readme.md']) {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      readme = filePath;
      break;
    }
  }
  let docs = [];
  for (const docsDir of ['docs', 'dist/docs']) {
    const dirPath = path.join(dir, docsDir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      docs = listMarkdownFiles({ dir: dirPath });
      break;
    }
  }
  return { readme, docs };
}

export default listPackageDocFiles;
