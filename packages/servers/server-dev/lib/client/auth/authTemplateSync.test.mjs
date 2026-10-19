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

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const devAuthDir = path.dirname(fileURLToPath(import.meta.url));
const prodAuthDir = path.resolve(devAuthDir, '../../../../server/lib/client/auth');

// The dev and prod server templates each carry their own copy of the auth
// components, kept in sync by hand. A change applied to one and not the
// other ships dev-only or prod-only - the app then behaves differently
// between lowdefy dev and a production build, which no unit test of either
// copy can catch.
test('the auth client templates are byte-identical between server and server-dev', async () => {
  const isTemplate = (file) => !file.includes('.test.');
  const devFiles = (await readdir(devAuthDir)).filter(isTemplate).sort();
  const prodFiles = (await readdir(prodAuthDir)).filter(isTemplate).sort();
  expect(prodFiles).toEqual(devFiles);
  for (const file of devFiles) {
    const dev = await readFile(path.join(devAuthDir, file), 'utf8');
    const prod = await readFile(path.join(prodAuthDir, file), 'utf8');
    // Compared per file so a failure names the file that diverged.
    expect({ file, content: prod }).toEqual({ file, content: dev });
  }
});
