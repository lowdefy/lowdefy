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

import renderReference from './renderReference.mjs';
import { createSkillFile, replaceGeneratedRegion, wrapGenerated } from './skillFile.mjs';

const TYPE_KINDS = ['blocks', 'operators', 'actions', 'connections', 'requests'];

function validateEntry({ name, entry }) {
  const problems = [];
  if (typeof entry.description !== 'string' || !entry.description.startsWith('Use when')) {
    problems.push('description must start with "Use when"');
  }
  if (typeof entry.title !== 'string' || entry.title === '') {
    problems.push('title is required');
  }
  if (typeof entry.recipe !== 'string' || entry.recipe === '') {
    problems.push('recipe is required');
  }
  if (!Array.isArray(entry.docSlugs)) {
    problems.push('docSlugs must be an array');
  }
  for (const kind of Object.keys(entry.types ?? {})) {
    if (!TYPE_KINDS.includes(kind)) {
      problems.push(`unknown type kind "${kind}"`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Skill "${name}": ${problems.join('; ')}.`);
  }
}

async function resolveEntry({ name, entry, resolveDoc, resolveType }) {
  const missing = [];
  const docs = [];
  for (const slug of entry.docSlugs) {
    const doc = resolveDoc(slug);
    if (doc === null) {
      missing.push(`doc slug "${slug}" is not in @lowdefy/docs-content index.json`);
    } else {
      docs.push(doc);
    }
  }
  const types = {};
  for (const kind of TYPE_KINDS) {
    types[kind] = [];
    for (const typeName of entry.types?.[kind] ?? []) {
      const resolved = await resolveType({ kind, typeName });
      if (resolved.error) {
        missing.push(resolved.error);
      } else {
        types[kind].push(resolved);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Skill "${name}" references sources that do not exist:\n  - ${missing.join('\n  - ')}`
    );
  }
  return { docs, types };
}

// Generates every skill in the manifest. readSkill(name) returns the current file content or
// null; writeSkill(name, content) persists it. Fails on the first entry with a missing source so
// a renamed doc page or type cannot silently empty a skill.
async function generateSkills({ manifest, resolveDoc, resolveType, readSkill, writeSkill }) {
  const results = [];
  for (const [name, entry] of Object.entries(manifest)) {
    validateEntry({ name, entry });
    const resolved = await resolveEntry({ name, entry, resolveDoc, resolveType });
    const generated = wrapGenerated(renderReference({ resolved }));
    const existing = readSkill(name);
    let content;
    let action;
    if (existing === null) {
      content = createSkillFile({
        name,
        description: entry.description,
        title: entry.title,
        generated: renderReference({ resolved }),
        recipe: entry.recipe,
      });
      action = 'created';
    } else {
      content = replaceGeneratedRegion({ content: existing, generated });
      action = content === existing ? 'unchanged' : 'updated';
    }
    if (action !== 'unchanged') {
      writeSkill(name, content);
    }
    results.push({ name, action });
  }
  return results;
}

export default generateSkills;
