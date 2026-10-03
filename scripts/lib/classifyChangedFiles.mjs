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

// Files no test reads: a change to them alone never widens the fast path to every package.
const docsOnlyPrefixes = ['code-docs/', '.changeset/', '.claude/'];
const docsOnlyBasenames = ['CHANGELOG.md', 'README.md'];

function isDocsOnly(file) {
  if (docsOnlyPrefixes.some((prefix) => file.startsWith(prefix))) {
    return true;
  }
  if (!file.includes('/') && file.endsWith('.md')) {
    return true;
  }
  const basename = file.split('/').pop();
  return docsOnlyBasenames.includes(basename);
}

// Decides how much of the monorepo the fast CI path builds and tests for a set of changed
// files. A file inside a workspace package is left to turbo's affected filter, which picks
// the package and everything that depends on it. Any other file (the lockfile, the root
// package.json, turbo.json, .github/, scripts/, shared swc and eslint config, apps/) can
// change any package's result, so the run falls back to every package.
function classifyChangedFiles({ files }) {
  let website = false;
  for (const file of files) {
    if (isDocsOnly(file)) {
      continue;
    }
    if (file.startsWith('packages/website/')) {
      website = true;
      continue;
    }
    if (!file.startsWith('packages/')) {
      return { all: true, reason: `${file} is outside the workspace packages`, website: true };
    }
  }
  return { all: false, reason: null, website };
}

export default classifyChangedFiles;
