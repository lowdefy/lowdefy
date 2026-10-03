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
  Works out what the fast CI path (.github/workflows/test-fast.yml) tests: every package,
  or the packages changed since a base commit and their dependents (turbo's
  `...[<base>]` filter). Writes `filter` (turbo filter arguments, empty for every package),
  `website` (whether to build @lowdefy/website) and `scope` to $GITHUB_OUTPUT, and a line
  to the job summary.

  Usage: node scripts/ci-scope.mjs --base <commit>
  An empty or all-zero base (a new branch) tests every package.
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { parseArgs } from 'node:util';

import classifyChangedFiles from './lib/classifyChangedFiles.mjs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function resolveBase(base) {
  if (!base || /^0+$/.test(base)) {
    return null;
  }
  try {
    return git(['rev-parse', '--verify', `${base}^{commit}`]);
  } catch {
    return null;
  }
}

function decideScope({ base }) {
  const baseSha = resolveBase(base);
  if (baseSha === null) {
    return { all: true, reason: `base "${base}" is not a commit in this checkout`, website: true };
  }
  const files = git(['diff', '--name-only', baseSha, 'HEAD']).split('\n').filter(Boolean);
  console.log(`${files.length} files changed since ${baseSha}:\n  ${files.join('\n  ')}`);
  return { ...classifyChangedFiles({ files }), baseSha };
}

function writeOutputs({ all, reason, website, baseSha }) {
  // @lowdefy/docs always runs: its docs-content staleness test hashes files from other
  // packages (block examples, plugin docs) that are not its dependencies.
  const filter = all ? '' : `--filter='...[${baseSha}]' --filter=@lowdefy/docs`;
  const scope = all ? `every package (${reason})` : `packages changed since ${baseSha}`;
  console.log(`Scope: ${scope}. Website build: ${website}.`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `filter=${filter}\nwebsite=${website}\nscope=${scope}\n`
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Fast path tests ${scope}.\n`);
  }
}

const { values } = parseArgs({ options: { base: { type: 'string', default: '' } } });
writeOutputs(decideScope({ base: values.base }));
