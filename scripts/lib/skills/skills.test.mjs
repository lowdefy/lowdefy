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
import { firstParagraph } from './createDocsResolver.mjs';
import { trimGalleryExample } from './createPluginTypesResolver.mjs';
import generateSkills from './generateSkills.mjs';
import { countSkillLines, parseFrontmatter } from './skillFile.mjs';

const docs = {
  'concepts/lists': {
    slug: 'concepts/lists',
    title: 'Lists',
    firstParagraph: 'List category blocks render multiple content areas.',
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
    description: 'Use when repeating blocks.',
    title: 'List blocks',
    docSlugs: ['concepts/lists'],
    types: { blocks: ['List'], operators: ['_if'] },
    recipe: 'Must cover: list ids.',
  },
};

test('generateSkills creates a skill with frontmatter, generated reference and recipe stub', async () => {
  const store = createStore();
  const results = await generateSkills({ manifest, ...createFakes(), ...store });
  assert.deepEqual(results, [{ name: 'lowdefy-lists', action: 'created' }]);
  const content = store.files['lowdefy-lists'];
  assert.deepEqual(parseFrontmatter(content), {
    name: 'lowdefy-lists',
    description: 'Use when repeating blocks.',
  });
  assert.match(content, /^# List blocks$/m);
  assert.match(content, /<!-- generated:reference:start -->/);
  assert.match(content, /`\/lowdefy-docs\/content\/concepts\/lists`/);
  assert.match(content, /\| `direction` \| string \| {2}\| `"vertical"` \| Dir\. \|/);
  assert.match(content, /- `onClick`: Clicked\./);
  assert.match(content, /```yaml\n- id: list\n {2}type: List\n```/);
  assert.match(content, /\| `test` \| boolean \| yes \| {2}\| Condition\. \|/);
  assert.match(content, /## Recipe\n\nMust cover: list ids\.\n$/);
});

test('generateSkills is deterministic and idempotent', async () => {
  const first = createStore();
  await generateSkills({ manifest, ...createFakes(), ...first });
  const second = createStore();
  await generateSkills({ manifest, ...createFakes(), ...second });
  assert.equal(first.files['lowdefy-lists'], second.files['lowdefy-lists']);

  const rerun = await generateSkills({ manifest, ...createFakes(), ...first });
  assert.deepEqual(rerun, [{ name: 'lowdefy-lists', action: 'unchanged' }]);
  assert.equal(first.files['lowdefy-lists'], second.files['lowdefy-lists']);
});

test('generateSkills preserves hand-written content outside the markers byte-for-byte', async () => {
  const store = createStore();
  await generateSkills({ manifest, ...createFakes(), ...store });
  const edited = store.files['lowdefy-lists']
    .replace('# List blocks', '# List blocks\n\nA hand-written intro.')
    .replace('Must cover: list ids.', '### Step 1\n\nWrite the list.\n\n### Step 2\n\nDone.');
  store.files['lowdefy-lists'] = edited;

  const results = await generateSkills({ manifest, ...createFakes(), ...store });
  assert.deepEqual(results, [{ name: 'lowdefy-lists', action: 'unchanged' }]);
  assert.equal(store.files['lowdefy-lists'], edited);

  // A changed source rewrites only the generated region.
  docs['concepts/lists'].firstParagraph = 'Changed paragraph.';
  const updated = await generateSkills({ manifest, ...createFakes(), ...store });
  assert.deepEqual(updated, [{ name: 'lowdefy-lists', action: 'updated' }]);
  const content = store.files['lowdefy-lists'];
  assert.match(content, /Changed paragraph\./);
  assert.match(content, /A hand-written intro\./);
  assert.match(content, /### Step 2\n\nDone\.\n$/);
  docs['concepts/lists'].firstParagraph = 'List category blocks render multiple content areas.';
});

test('generateSkills fails naming the entry when a doc slug is missing', async () => {
  const broken = {
    'lowdefy-broken': { ...manifest['lowdefy-lists'], docSlugs: ['concepts/renamed-page'] },
  };
  const store = createStore();
  await assert.rejects(
    generateSkills({ manifest: broken, ...createFakes(), ...store }),
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
    generateSkills({ manifest: broken, ...createFakes(), ...createStore() }),
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
    generateSkills({ manifest: broken, ...createFakes(), ...createStore() }),
    /Skill "lowdefy-broken": description must start with "Use when"/
  );
});

test('firstParagraph skips the title, blockquotes, headings and code fences', () => {
  const markdown = `# _js\n\n> Experimental.\n\n\`\`\`\n(function: string): any\n\`\`\`\n\nThe \`_js\` operator enables\ncustom JavaScript.\n\nSecond paragraph.`;
  assert.equal(firstParagraph(markdown), 'The `_js` operator enables custom JavaScript.');
});

test('trimGalleryExample returns the first block of the first section, dedented', () => {
  const gallery = `# header\n\n- title: Basic\n  blocks:\n    - id: basic_default\n      type: TextInput\n      properties:\n        title: Default\n    - id: second\n      type: TextInput\n\n- title: Sizes\n  blocks:\n    - id: size_small\n`;
  assert.equal(
    trimGalleryExample(gallery),
    '- id: basic_default\n  type: TextInput\n  properties:\n    title: Default'
  );
  assert.equal(trimGalleryExample('- title: Empty\n'), null);
});

test('countSkillLines splits total, generated and recipe lines', () => {
  const content = [
    '---',
    'name: x',
    'description: Use when x.',
    '---',
    '',
    '# X',
    '',
    '<!-- generated:reference:start -->',
    '## Reference',
    'a',
    '<!-- generated:reference:end -->',
    '',
    '## Recipe',
    '',
    'Do this.',
    '',
  ].join('\n');
  assert.deepEqual(countSkillLines(content), { total: 15, generated: 4, recipe: 3 });
});

test('collectSkillMetrics prints one row per skill directory and a total', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-skill-metrics-'));
  try {
    for (const name of ['lowdefy-b', 'lowdefy-a']) {
      fs.mkdirSync(path.join(directory, name));
      fs.writeFileSync(
        path.join(directory, name, 'SKILL.md'),
        '---\nname: n\n---\n<!-- generated:reference:start -->\nx\n<!-- generated:reference:end -->\n## Recipe\nr\n'
      );
    }
    fs.mkdirSync(path.join(directory, 'not-a-skill'));
    fs.writeFileSync(path.join(directory, 'README.md'), 'readme');

    const metrics = collectSkillMetrics({ skillsDirectory: directory });
    assert.deepEqual(metrics.rows, [
      { name: 'lowdefy-a', total: 8, generated: 3, recipe: 2 },
      { name: 'lowdefy-b', total: 8, generated: 3, recipe: 2 },
    ]);
    assert.deepEqual(metrics.total, { total: 16, generated: 6, recipe: 4 });
    const output = formatSkillMetrics(metrics);
    assert.equal(output.split('\n').length, 4);
    assert.match(output, /total \(2 skills\)/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
