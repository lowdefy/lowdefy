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
import { fileURLToPath } from 'node:url';

const clientDirectory = path.dirname(fileURLToPath(import.meta.url));

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(js|jsx|mjs)$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });
}

// Dev serves HTTP/1.1, where a browser holds at most six connections per host.
// A second long-lived stream per tab once made dev pages load forever, so
// every dev channel shares Reload.jsx's one EventSource (DevStreamContext).
test('the dev client constructs exactly one EventSource, in Reload.jsx', () => {
  const constructions = listSourceFiles(clientDirectory).flatMap((file) => {
    const count = (fs.readFileSync(file, 'utf8').match(/new EventSource\(/g) ?? []).length;
    return Array.from({ length: count }, () => path.relative(clientDirectory, file));
  });
  expect(constructions).toEqual(['Reload.jsx']);
});
