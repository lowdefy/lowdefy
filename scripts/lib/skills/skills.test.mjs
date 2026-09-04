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

// Run with: pnpm skills:test  (node --test, no jest dependency at the repo root)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import collectSkillMetrics, { formatSkillMetrics } from './collectSkillMetrics.mjs';
import { trimGalleryExample } from './createPluginTypesResolver.mjs';
import generateSkills from './generateSkills.mjs';
import { parseFrontmatter } from './skillFile.mjs';

const VERSION = '9.9.9';

const docs = {
  'concepts/lists': {
    slug: 'concepts/lists',
    title: 'Lists',
  },
};

const types = {
  'blocks:List': {
    name: 'List',
    packageName: '@lowdefy/blocks-basic',
    meta: {
      category: 'list',
      events: { onClick: 'Clicked.' },
      properties: {
        type: 'object',
        properties: { direction: { type: 'string', default: 'vertical', description: 'Dir.' } },
      },
    },
    example: '- id: list\n  type: List',
  },
  'operators:_if': {
    name: '_if',
    packageName: '@lowdefy/operators-js',
    schema: {
      params: {
        type: 'object',
        required: ['test'],
        properties: { test: { type: 'boolean', description: 'Condition.' }, then: {} },
      },
    },
  },
};

function createFakes() {
  return {
    resolveDoc: (slug) => docs[slug] ?? null,
    resolveType: async ({ kind, typeName }) =>
      types[`${kind}:${typeName}`] ?? {
        error: `no plugin package provides ${kind} type "${typeName}"`,
      },
  };
}

function createStore(initial = {}) {
  const files = { ...initial };
  return {
    files,
    readSkill: (name) => files[name] ?? null,
    writeSkill: (name, content) => {
      files[name] = content;
    },
  };
}

const manifest = {
  'lowdefy-lists': {
    kind: 'reference',
    description: 'Use when repeating blocks.',
    title: 'List blocks',
    docSlugs: ['concepts/lists'],
    types: { blocks: ['List'], operators: ['_if'] },
    recipe: 'Must cover: list ids.',
  },
};

test('generateSkills creates a skill with frontmatter, generated reference and recipe stub', async () => {
  const store = createStore();
  const results = await generateSkills({ manifest, version: VERSION, ...createFakes(), ...store });
  assert.deepEqual(results, [{ name: 'lowdefy-lists', action: 'created' }]);
  const content = store.files['lowdefy-lists'];
  assert.deepEqual(parseFrontmatter(content), {
    name: 'lowdefy-lists',
    description: 'Use when repeating blocks.',
    kind: 'reference',
    lowdefyVersion: VERSION,
  });
  assert.match(content, /^# List blocks$/m);
  assert.match(content, /<!-- generated:reference:start -->/);
  assert.match(content, /## Recipe\n\nMust cover: list ids\.\n$/);
});

test('the generated Reference is an index of slugs and type names, not a copy of the schemas', async () => {
  const store = createStore();
  await generateSkills({ manifest, version: VERSION, ...createFakes(), ...store });
  const content = store.files['lowdefy-lists'];
  assert.match(content, /`lowdefy_get_doc` by slug .*: `concepts\/lists`\./);
  assert.match(content, /### Blocks\n\n.*`List` \(`@lowdefy\/blocks-basic`\)\./);
  assert.match(content, /### Operators\n\n.*`_if` \(`@lowdefy\/operators-js`\)\./);
  // None of the live-schema detail is restated: no property tables, events or example yaml.
  assert.doesNotMatch(content, /direction/);
  assert.doesNotMatch(content, /onClick/);
  assert.doesNotMatch(content, /```yaml/);
  assert.doesNotMatch(content, /Condition\./);
});

test('generateSkills rewrites the frontmatter so a version bump reaches an existing skill', async () => {
  const store = createStore();
  await generateSkills({ manifest, version: '1.0.0', ...createFakes(), ...store });
  const results = await generateSkills({ manifest, version: '2.0.0', ...createFakes(), ...store });
  assert.deepEqual(results, [{ name: 'lowdefy-lists', action: 'updated' }]);
  assert.equal(parseFrontmatter(store.files['lowdefy-lists']).lowdefyVersion, '2.0.0');
});

test('generateSkills requires a version to stamp', async () => {
  await assert.rejects(
    generateSkills({ manifest, ...createFakes(), ...createStore() }),
    /generateSkills requires the framework version/
  );
});

test('generateSkills rejects an entry without a recipe|reference kind', async () => {
  const broken = { 'lowdefy-broken': { ...manifest['lowdefy-lists'], kind: 'guide' } };
  await assert.rejects(
    generateSkills({ manifest: broken, version: VERSION, ...createFakes(), ...createStore() }),
    /Skill "lowdefy-broken": kind must be one of recipe \| reference/
  );
});

test('generateSkills is deterministic and idempotent', async () => {
  const first = createStore();
  await generateSkills({ manifest, version: VERSION, ...createFakes(), ...first });
  const second = createStore();
  await generateSkills({ manifest, version: VERSION, ...createFakes(), ...second });
  assert.equal(first.files['lowdefy-lists'], second.files['lowdefy-lists']);

  const rerun = await generateSkills({ manifest, version: VERSION, ...createFakes(), ...first });
  assert.deepEqual(rerun, [{ name: 'lowdefy-lists', action: 'unchanged' }]);
  assert.equal(first.files['lowdefy-lists'], second.files['lowdefy-lists']);
});

test('generateSkills preserves hand-written content outside the markers byte-for-byte', async () => {
  const store = createStore();
  await generateSkills({ manifest, version: VERSION, ...createFakes(), ...store });
  const edited = store.files['lowdefy-lists']
    .replace('# List blocks', '# List blocks\n\nA hand-written intro.')
    .replace('Must cover: list ids.', '### Step 1\n\nWrite the list.\n\n### Step 2\n\nDone.');
  store.files['lowdefy-lists'] = edited;

  const results = await generateSkills({ manifest, version: VERSION, ...createFakes(), ...store });
  assert.deepEqual(results, [{ name: 'lowdefy-lists', action: 'unchanged' }]);
  assert.equal(store.files['lowdefy-lists'], edited);

  // A Recipe that talks about the markers themselves is still only text below them.
  const withLookalikes = store.files['lowdefy-lists'].replace(
    '### Step 2\n\nDone.',
    '### Step 2\n\nNever edit between `<!-- generated:reference:start -->` and\n`<!-- generated:reference:end -->`; the generator owns that region.'
  );
  store.files['lowdefy-lists'] = withLookalikes;
  assert.deepEqual(
    await generateSkills({ manifest, version: VERSION, ...createFakes(), ...store }),
    [{ name: 'lowdefy-lists', action: 'unchanged' }]
  );
  assert.equal(store.files['lowdefy-lists'], withLookalikes);
  store.files['lowdefy-lists'] = edited;

  // A changed source rewrites only the generated region.
  const withMoreDocs = {
    'lowdefy-lists': { ...manifest['lowdefy-lists'], docSlugs: ['concepts/lists', 'concepts/x'] },
  };
  docs['concepts/x'] = { slug: 'concepts/x', title: 'X' };
  const updated = await generateSkills({
    manifest: withMoreDocs,
    version: VERSION,
    ...createFakes(),
    ...store,
  });
  assert.deepEqual(updated, [{ name: 'lowdefy-lists', action: 'updated' }]);
  const content = store.files['lowdefy-lists'];
  assert.match(content, /`concepts\/lists`, `concepts\/x`\./);
  assert.match(content, /A hand-written intro\./);
  assert.match(content, /### Step 2\n\nDone\.\n$/);
  delete docs['concepts/x'];
});

test('generateSkills fails naming the entry when a doc slug is missing', async () => {
  const broken = {
    'lowdefy-broken': { ...manifest['lowdefy-lists'], docSlugs: ['concepts/renamed-page'] },
  };
  const store = createStore();
  await assert.rejects(
    generateSkills({ manifest: broken, version: VERSION, ...createFakes(), ...store }),
    (error) =>
      error.message.includes('Skill "lowdefy-broken"') &&
      error.message.includes('doc slug "concepts/renamed-page" is not in @lowdefy/docs-content')
  );
  assert.deepEqual(store.files, {});
});

test('generateSkills fails naming the entry and every missing type', async () => {
  const broken = {
    'lowdefy-broken': {
      ...manifest['lowdefy-lists'],
      types: { blocks: ['Lisst'], actions: ['SetStat'] },
    },
  };
  await assert.rejects(
    generateSkills({ manifest: broken, version: VERSION, ...createFakes(), ...createStore() }),
    (error) =>
      error.message.includes('Skill "lowdefy-broken"') &&
      error.message.includes('blocks type "Lisst"') &&
      error.message.includes('actions type "SetStat"')
  );
});

test('generateSkills rejects a description that does not start with "Use when"', async () => {
  const broken = {
    'lowdefy-broken': { ...manifest['lowdefy-lists'], description: 'Lists things.' },
  };
  await assert.rejects(
    generateSkills({ manifest: broken, version: VERSION, ...createFakes(), ...createStore() }),
    /Skill "lowdefy-broken": description must start with "Use when"/
  );
});

test('trimGalleryExample returns the first block of the first section, dedented', () => {
  const gallery = `# header\n\n- title: Basic\n  blocks:\n    - id: basic_default\n      type: TextInput\n      properties:\n        title: Default\n    - id: second\n      type: TextInput\n\n- title: Sizes\n  blocks:\n    - id: size_small\n`;
  assert.equal(
    trimGalleryExample(gallery),
    '- id: basic_default\n  type: TextInput\n  properties:\n    title: Default'
  );
  assert.equal(trimGalleryExample('- title: Empty\n'), null);
});

test('collectSkillMetrics reports each skill kind and counts the recipe skills', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-skill-metrics-'));
  try {
    const kinds = { 'lowdefy-b': 'recipe', 'lowdefy-a': 'reference', 'lowdefy-c': 'recipe' };
    for (const [name, kind] of Object.entries(kinds)) {
      fs.mkdirSync(path.join(directory, name));
      fs.writeFileSync(
        path.join(directory, name, 'SKILL.md'),
        `---\nname: ${name}\ndescription: Use when x.\nkind: ${kind}\nlowdefyVersion: 9.9.9\n---\n\n# X\n`
      );
    }
    fs.mkdirSync(path.join(directory, 'not-a-skill'));
    fs.writeFileSync(path.join(directory, 'README.md'), 'readme');

    const metrics = collectSkillMetrics({ skillsDirectory: directory });
    assert.deepEqual(metrics.rows, [
      { name: 'lowdefy-a', kind: 'reference', lowdefyVersion: '9.9.9' },
      { name: 'lowdefy-b', kind: 'recipe', lowdefyVersion: '9.9.9' },
      { name: 'lowdefy-c', kind: 'recipe', lowdefyVersion: '9.9.9' },
    ]);
    assert.deepEqual(metrics.recipes, ['lowdefy-b', 'lowdefy-c']);
    assert.match(formatSkillMetrics(metrics), /recipe skills: 2 of 3/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
