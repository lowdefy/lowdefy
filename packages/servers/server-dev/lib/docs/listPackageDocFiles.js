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

// Docs are served from inside the package only: a file, or a docs folder,
// that links outside it is left out, as is a link that points nowhere or a
// directory named like a markdown file.
function isFileInside({ realDir, filePath }) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const realPath = fs.realpathSync(filePath);
  return realPath.startsWith(`${realDir}${path.sep}`) && fs.statSync(realPath).isFile();
}

function listMarkdownFiles({ realDir, dir }) {
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort()
    .map((fileName) => path.join(dir, fileName))
    .filter((filePath) => isFileInside({ realDir, filePath }));
}

// The markdown a plugin or module ships: its README, and the files in docs/
// (a plugin that builds its docs may only have dist/docs/).
function listPackageDocFiles({ dir }) {
  // A local plugin or module can be removed while the server runs.
  if (!fs.existsSync(dir)) {
    return { readme: null, docs: [] };
  }
  const realDir = fs.realpathSync(dir);
  let readme = null;
  for (const fileName of ['README.md', 'readme.md']) {
    const filePath = path.join(dir, fileName);
    if (isFileInside({ realDir, filePath })) {
      readme = filePath;
      break;
    }
  }
  let docs = [];
  for (const docsDir of ['docs', 'dist/docs']) {
    const dirPath = path.join(dir, docsDir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      docs = listMarkdownFiles({ realDir, dir: dirPath });
      break;
    }
  }
  return { readme, docs };
}

export default listPackageDocFiles;
