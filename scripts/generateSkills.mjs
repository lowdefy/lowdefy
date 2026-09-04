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
  Generate the Reference section of every framework-owned skill in skills/.

  Usage:
    pnpm skills:generate

  Reads skills/skills.manifest.mjs, @lowdefy/docs-content (index.json + content) and the built
  plugin packages under packages/plugins (run `pnpm build` first). For each manifest entry it
  creates skills/<name>/SKILL.md or rewrites only the region between the generated markers,
  leaving the hand-written Recipe untouched. Exits non-zero, naming the entry, when a doc slug or
  type does not exist.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import createDocsResolver from './lib/skills/createDocsResolver.mjs';
import createPluginTypesResolver from './lib/skills/createPluginTypesResolver.mjs';
import generateSkills from './lib/skills/generateSkills.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIRECTORY = path.join(REPO_ROOT, 'skills');

const { default: manifest } = await import(path.join(SKILLS_DIRECTORY, 'skills.manifest.mjs'));

// The `lowdefy` package is the CLI, and its version is the framework version an app installs.
const { version } = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'packages', 'cli', 'package.json'), 'utf8')
);

const resolveDoc = createDocsResolver({
  docsContentDirectory: path.join(REPO_ROOT, 'packages', 'docs-content'),
});
const resolveType = await createPluginTypesResolver({
  pluginsDirectory: path.join(REPO_ROOT, 'packages', 'plugins'),
});

function skillPath(name) {
  return path.join(SKILLS_DIRECTORY, name, 'SKILL.md');
}

try {
  const results = await generateSkills({
    manifest,
    version,
    resolveDoc,
    resolveType,
    readSkill: (name) =>
      fs.existsSync(skillPath(name)) ? fs.readFileSync(skillPath(name), 'utf8') : null,
    writeSkill: (name, content) => {
      fs.mkdirSync(path.dirname(skillPath(name)), { recursive: true });
      fs.writeFileSync(skillPath(name), content);
    },
  });
  for (const { name, action } of results) {
    console.log(`${action.padEnd(9)} skills/${name}/SKILL.md`);
  }
  console.log(`${results.length} skills generated.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
