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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDirectory = path.join(packageDirectory, '../..');

const index = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'index.json'), 'utf8'));
const hazards = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'hazards.json'), 'utf8'));
const slugs = new Set(index.docs.map((doc) => doc.slug));

// Plugin-declared hazards ride on meta.js / metas.js exports and reach the dev
// MCP through the build's plugin artifacts. Reading the sources keeps the test
// honest without depending on a build having run.
function readPluginHazards() {
  const pluginsDirectory = path.join(repoDirectory, 'packages/plugins');
  const found = [];
  const files = fs
    .readdirSync(pluginsDirectory, { recursive: true })
    .filter((entry) => entry.endsWith('meta.js') || entry.endsWith('metas.js'))
    .map((entry) => path.join(pluginsDirectory, entry))
    .filter((filePath) => !filePath.includes('node_modules') && !filePath.includes('/dist/'))
    .filter((filePath) => fs.readFileSync(filePath, 'utf8').includes('hazards'));
  return Promise.all(
    files.map(async (filePath) => {
      const module = await import(filePath);
      for (const exported of Object.values(module)) {
        for (const hazard of exported?.hazards ?? []) {
          found.push({ ...hazard, source: path.relative(repoDirectory, filePath) });
        }
      }
    })
  ).then(() => found);
}

const pluginHazards = await readPluginHazards();

test('every hazard declares whether it is a bug or documented semantics', () => {
  for (const hazard of hazards) {
    assert.ok(
      hazard.kind === 'bug' || hazard.kind === 'semantics',
      `Hazard "${hazard.id}" has kind ${JSON.stringify(
        hazard.kind
      )}, expected "bug" or "semantics".`
    );
  }
});

test('every bug hazard names the task or issue that retires it', () => {
  for (const hazard of hazards.filter((entry) => entry.kind === 'bug')) {
    assert.ok(
      typeof hazard.retiredBy === 'string' && hazard.retiredBy.trim() !== '',
      `Bug hazard "${hazard.id}" has no retiredBy. A bug hazard must name the task or issue that removes it.`
    );
  }
});

test('a semantics hazard does not name a retiring task', () => {
  for (const hazard of hazards.filter((entry) => entry.kind === 'semantics')) {
    assert.equal(
      hazard.retiredBy,
      undefined,
      `Hazard "${hazard.id}" is documented semantics but names retiredBy ${JSON.stringify(
        hazard.retiredBy
      )}.`
    );
  }
});

test('every hazard see slug resolves in index.json', () => {
  const unresolved = [...hazards, ...pluginHazards]
    .filter((hazard) => hazard.see !== undefined && hazard.see !== null)
    .filter((hazard) => !slugs.has(hazard.see))
    .map((hazard) => `${hazard.id} -> ${hazard.see}${hazard.source ? ` (${hazard.source})` : ''}`);
  assert.deepEqual(unresolved, [], `Hazards pointing at slugs that do not exist: ${unresolved}`);
});

test('hazard ids are unique across hazards.json and every plugin meta', () => {
  const seen = new Map();
  const duplicates = [];
  for (const hazard of [...hazards, ...pluginHazards]) {
    const source = hazard.source ?? 'hazards.json';
    if (seen.has(hazard.id)) {
      duplicates.push(`${hazard.id} in ${seen.get(hazard.id)} and ${source}`);
      continue;
    }
    seen.set(hazard.id, source);
  }
  assert.deepEqual(duplicates, [], `Duplicate hazard ids: ${duplicates}`);
});

test('every docSlug in the skills manifest resolves in index.json', async () => {
  const { default: manifest } = await import(
    path.join(repoDirectory, 'skills/skills.manifest.mjs')
  );
  const unresolved = Object.entries(manifest).flatMap(([name, entry]) =>
    (entry.docSlugs ?? []).filter((slug) => !slugs.has(slug)).map((slug) => `${name} -> ${slug}`)
  );
  assert.deepEqual(unresolved, [], `Skills naming slugs that do not exist: ${unresolved}`);
});
