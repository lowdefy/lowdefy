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

import { VALID_CHECK_SLUGS } from '@lowdefy/errors';

import renderCheckSlugsTable from './renderCheckSlugsTable.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsPath = path.join(__dirname, '../../../docs/concepts/lowdefy-schema.yaml');

test('renderCheckSlugsTable renders a markdown row per slug at the given indent', () => {
  expect(renderCheckSlugsTable({ slugs: { 'a-b': 'Does a thing.' }, indent: '  ' })).toBe(
    [
      '  | Slug | What it suppresses |',
      '  |------|-------------------|',
      '  | `a-b` | Does a thing. |',
    ].join('\n')
  );
});

// The docs table is generated from VALID_CHECK_SLUGS by
// packages/build/scripts/generateCheckSlugsTable.mjs. Run it when this fails.
test('the ~ignoreBuildChecks table in the docs matches VALID_CHECK_SLUGS', () => {
  const contents = fs.readFileSync(docsPath, 'utf8');
  const start = contents.indexOf('<!-- check-slugs:start -->');
  const end = contents.indexOf('<!-- check-slugs:end -->');
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const table = contents
    .slice(start + '<!-- check-slugs:start -->'.length, end)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
  expect(table).toBe(renderCheckSlugsTable({ slugs: VALID_CHECK_SLUGS }));
});
