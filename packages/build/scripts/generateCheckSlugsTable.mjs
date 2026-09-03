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

// Rewrites the ~ignoreBuildChecks slug table in the docs from VALID_CHECK_SLUGS,
// so the catalogue and the page an author reads cannot drift.
//
//   pnpm --filter=@lowdefy/build exec node scripts/generateCheckSlugsTable.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import VALID_CHECK_SLUGS from '../../utils/errors/src/checkSlugs.js';
import renderCheckSlugsTable from '../src/utils/renderCheckSlugsTable.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsPath = path.join(__dirname, '../../docs/concepts/lowdefy-schema.yaml');

const START = '<!-- check-slugs:start -->';
const END = '<!-- check-slugs:end -->';

const contents = fs.readFileSync(docsPath, 'utf8');
const startIndex = contents.indexOf(START);
const endIndex = contents.indexOf(END);
if (startIndex === -1 || endIndex === -1) {
  throw new Error(`Markers ${START} / ${END} not found in ${docsPath}.`);
}

const indent = ' '.repeat(contents.slice(0, startIndex).split('\n').pop().length);
const table = renderCheckSlugsTable({ slugs: VALID_CHECK_SLUGS, indent });

const updated = `${contents.slice(0, startIndex)}${START}\n${table}\n${indent}${contents.slice(
  endIndex
)}`;
fs.writeFileSync(docsPath, updated);
console.log(`Wrote ${Object.keys(VALID_CHECK_SLUGS).length} check slugs to ${docsPath}.`);
