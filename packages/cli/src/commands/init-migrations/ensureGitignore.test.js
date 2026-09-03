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
import os from 'node:os';
import path from 'node:path';

import ensureGitignore, { GITIGNORE_LINES } from './ensureGitignore.js';

let configDirectory;
const context = { logger: { info: () => {}, warn: () => {} } };

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-gitignore-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('ensureGitignore creates .gitignore with the ledger lines when there is none', async () => {
  expect(await ensureGitignore({ context, configDirectory })).toBe(true);
  expect(fs.readFileSync(path.join(configDirectory, '.gitignore'), 'utf8')).toBe(
    `${GITIGNORE_LINES.join('\n')}\n`
  );
});

test('ensureGitignore appends only the missing lines to an existing file without a trailing newline', async () => {
  fs.writeFileSync(path.join(configDirectory, '.gitignore'), '.lowdefy/*\n.env');
  await ensureGitignore({ context, configDirectory });
  expect(fs.readFileSync(path.join(configDirectory, '.gitignore'), 'utf8')).toBe(
    '.lowdefy/*\n.env\n!.lowdefy/migrations/\n.lowdefy/migrations/local.json\n'
  );
});

test('ensureGitignore leaves a file that already has both lines untouched', async () => {
  const content = '.lowdefy/*\n!.lowdefy/migrations/\n.lowdefy/migrations/local.json\n.env\n';
  fs.writeFileSync(path.join(configDirectory, '.gitignore'), content);
  expect(await ensureGitignore({ context, configDirectory })).toBe(false);
  expect(fs.readFileSync(path.join(configDirectory, '.gitignore'), 'utf8')).toBe(content);
});

test('ensureGitignore replaces the .lowdefy/** pattern that git cannot re-include below', async () => {
  const content = '.lowdefy/**\n!.lowdefy/migrations/\n.lowdefy/migrations/local.json\n.env\n';
  fs.writeFileSync(path.join(configDirectory, '.gitignore'), content);
  expect(await ensureGitignore({ context, configDirectory })).toBe(true);
  expect(fs.readFileSync(path.join(configDirectory, '.gitignore'), 'utf8')).toBe(
    '.lowdefy/*\n!.lowdefy/migrations/\n.lowdefy/migrations/local.json\n.env\n'
  );
});
