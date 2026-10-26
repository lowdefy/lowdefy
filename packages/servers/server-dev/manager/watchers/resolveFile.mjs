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

const EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json'];

// TypeScript sources import each other by the name of their output
// ('./find.js' for find.ts), which Vite resolves to the source.
const TYPESCRIPT_SOURCES = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
};

// The real path of the file an import of `base` loads, trying the extensions
// and index files Vite tries, or null when there is none.
function resolveFile(base) {
  const extension = path.extname(base);
  const stem = base.slice(0, base.length - extension.length);
  const candidates = [
    base,
    ...(TYPESCRIPT_SOURCES[extension] ?? []).map((source) => `${stem}${source}`),
    ...EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...EXTENSIONS.map((candidate) => path.join(base, `index${candidate}`)),
  ];
  const found = candidates.find((candidate) =>
    fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()
  );
  return found ? fs.realpathSync(found) : null;
}

export default resolveFile;
