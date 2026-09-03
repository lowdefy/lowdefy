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
  Copy a Lowdefy app's config directory and pin it to a framework version.

  Usage:
    node scripts/canary/prepareApp.mjs --app packages/docs --out .canary/docs --version 0.0.0-experimental-20260901020115

  Copies --app to --out (excluding node_modules, dist, .lowdefy), rewrites the
  `lowdefy:` version in lowdefy.yaml to --version, and rewrites every plugin whose
  version is `workspace:*` or `local` to the same version, so the copy installs the
  framework from npm exactly the way a downstream app does. The source tree is
  never modified. Zero external dependencies.
*/

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const EXCLUDED_DIRECTORIES = new Set(['node_modules', 'dist', '.lowdefy']);

function fail(message) {
  console.error(`prepareApp: ${message}`);
  process.exit(1);
}

function parseOptions() {
  const { values } = parseArgs({
    options: {
      app: { type: 'string' },
      out: { type: 'string' },
      version: { type: 'string' },
    },
  });
  ['app', 'out', 'version'].forEach((name) => {
    if (!values[name]) {
      fail(`--${name} is required.`);
    }
  });
  return {
    appDirectory: path.resolve(REPO_ROOT, values.app),
    outDirectory: path.resolve(REPO_ROOT, values.out),
    version: values.version,
  };
}

function copyApp({ appDirectory, outDirectory }) {
  if (!existsSync(path.join(appDirectory, 'lowdefy.yaml'))) {
    fail(`${appDirectory} has no lowdefy.yaml.`);
  }
  if (outDirectory === appDirectory || outDirectory.startsWith(`${appDirectory}${path.sep}`)) {
    fail(`--out must be outside --app. Received ${outDirectory}.`);
  }
  rmSync(outDirectory, { recursive: true, force: true });
  mkdirSync(outDirectory, { recursive: true });
  cpSync(appDirectory, outDirectory, {
    recursive: true,
    filter: (source) => !EXCLUDED_DIRECTORIES.has(path.basename(source)),
  });
}

// Line-based rewrite rather than a YAML round-trip: a parse/serialize pass would
// reorder keys, drop comments and change quoting across the whole file, and the
// two keys of interest are always their own lines.
function rewriteVersions({ content, version }) {
  const lines = content.split('\n');
  let rewroteLowdefy = false;
  let rewrotePlugins = 0;
  const rewritten = lines.map((line) => {
    if (/^lowdefy:\s*\S/.test(line)) {
      rewroteLowdefy = true;
      return `lowdefy: ${version}`;
    }
    const plugin = line.match(/^(\s+version:\s*)(['"]?)(workspace:\*|local)\2\s*$/);
    if (plugin !== null) {
      rewrotePlugins += 1;
      return `${plugin[1]}'${version}'`;
    }
    return line;
  });
  if (!rewroteLowdefy) {
    fail('lowdefy.yaml has no top-level "lowdefy:" version to rewrite.');
  }
  return { content: rewritten.join('\n'), rewrotePlugins };
}

const { appDirectory, outDirectory, version } = parseOptions();
copyApp({ appDirectory, outDirectory });

const lowdefyYamlPath = path.join(outDirectory, 'lowdefy.yaml');
const { content, rewrotePlugins } = rewriteVersions({
  content: readFileSync(lowdefyYamlPath, 'utf8'),
  version,
});
writeFileSync(lowdefyYamlPath, content);

console.log(`Prepared ${path.relative(REPO_ROOT, outDirectory)} from ${path.relative(REPO_ROOT, appDirectory)}`);
console.log(`  lowdefy: ${version}`);
console.log(`  plugins rewritten: ${rewrotePlugins}`);
