#!/usr/bin/env node
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

/*
  Counts the corpus shape of a Lowdefy config directory: how much of it is
  JavaScript or HTML inside YAML, how many files are too long to read at once,
  how much of the comment budget is spent stating rules the config cannot, and
  which `_js` helpers have been hand-copied for want of a module system.

  Usage:
    node scripts/census/census.mjs <config-directory> [--json]
    pnpm census examples/canary-app

  Every definition is written out in scripts/census/README.md, so a number here
  can be compared against the census in the design's Appendix A.
*/

import fs from 'node:fs';
import path from 'node:path';

import formatCensus from './formatCensus.mjs';
import takeCensus from './takeCensus.mjs';

function run() {
  const args = process.argv.slice(2);
  const positional = args.filter((arg) => !arg.startsWith('--'));
  if (positional.length !== 1) {
    console.error('Usage: node scripts/census/census.mjs <config-directory> [--json]');
    process.exit(1);
  }
  const directory = path.resolve(positional[0]);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    console.error(`Census directory "${directory}" does not exist.`);
    process.exit(1);
  }
  const result = takeCensus({ directory });
  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(formatCensus({ result }));
}

run();
