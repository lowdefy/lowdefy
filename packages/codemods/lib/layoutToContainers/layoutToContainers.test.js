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
import test from 'node:test';
import { parseDocument } from 'yaml';

import layoutToContainers from './layoutToContainers.js';

function run(source) {
  const config = parseDocument(source);
  const { config: rewritten, report } = layoutToContainers({ config });
  return { yaml: rewritten.toString(), report, json: rewritten.toJS() };
}

test('span siblings become one Grid of 24 columns with col-span classes', () => {
  const { yaml, json } = run(`
id: home
type: Box
blocks:
  - id: left
    type: Box
    layout:
      span: 8
  - id: right
    type: Box
    layout:
      span: 16
`);
  assert.equal(json.blocks.length, 1);
  assert.deepEqual(json.blocks[0].id, 'home_grid_1');
  assert.deepEqual(json.blocks[0].type, 'Grid');
  assert.deepEqual(json.blocks[0].properties, { columns: 24 });
  assert.deepEqual(
    json.blocks[0].blocks.map((block) => block.class),
    ['col-span-8', 'col-span-16']
  );
  assert.ok(!yaml.includes('layout:'));
});

test('offset accumulates across the row into col-start', () => {
  const { json } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 6
  - id: b
    layout:
      span: 6
      offset: 2
  - id: c
    layout:
      span: 4
      offset: 1
`);
  assert.deepEqual(
    json.blocks[0].blocks.map((block) => block.class),
    ['col-span-6', 'col-span-6 col-start-9', 'col-span-4 col-start-16']
  );
});

test('a run that overflows 24 columns restarts the cursor and is reported for review', () => {
  const { json, report } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 16
  - id: b
    layout:
      span: 12
      offset: 2
`);
  assert.deepEqual(
    json.blocks[0].blocks.map((block) => block.class),
    ['col-span-16', 'col-span-12 col-start-3']
  );
  assert.ok(
    report.some((entry) => entry.action === 'review' && /past 24 columns/.test(entry.message))
  );
});

test('a child whose own offset and span exceed 24 columns is left untouched and reported', () => {
  const { json, report } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 20
      offset: 8
`);
  assert.deepEqual(json.blocks[0].blocks[0].layout, { span: 20, offset: 8 });
  assert.ok(
    report.some((entry) => entry.action === 'manual' && /exceeds 24 columns/.test(entry.message))
  );
});

test('flex keys become a Row and Tailwind flex utilities', () => {
  const { json } = run(`
id: toolbar
blocks:
  - id: search
    layout:
      grow: 1
  - id: refresh
    layout:
      shrink: 0
      size: 120
`);
  assert.equal(json.blocks[0].type, 'Row');
  assert.equal(json.blocks[0].id, 'toolbar_row_1');
  assert.deepEqual(
    json.blocks[0].blocks.map((block) => block.class),
    ['grow', 'shrink-0 basis-[120px]']
  );
});

test('selfAlign becomes a self-* class on the child', () => {
  const { json } = run(`
id: home
blocks:
  - id: a
    layout:
      grow: 1
      selfAlign: middle
`);
  assert.equal(json.blocks[0].blocks[0].class, 'self-center grow');
});

test('a column area becomes a Stack and area keys move to its properties', () => {
  const { json } = run(`
id: home
slots:
  content:
    direction: column
    gap: 16
    align: middle
    blocks:
      - id: a
      - id: b
`);
  const stack = json.slots.content.blocks[0];
  assert.equal(stack.type, 'Stack');
  assert.equal(stack.id, 'home_stack_1');
  assert.deepEqual(stack.properties, { gap: 'md', align: 'center' });
  assert.equal(json.slots.content.direction, undefined);
  assert.equal(json.slots.content.gap, undefined);
});

test('area gap, justify and wrap move onto the Row properties', () => {
  const { json } = run(`
id: home
slots:
  content:
    gap: 8
    justify: space-between
    wrap: nowrap
    blocks:
      - id: a
        layout:
          grow: 1
      - id: b
        layout:
          grow: 1
`);
  assert.deepEqual(json.slots.content.blocks[0].properties, {
    gap: 'sm',
    justify: 'between',
    wrap: 'nowrap',
  });
});

test('an operator-valued layout is reported and left exactly as written', () => {
  const { json, report } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 12
  - id: dynamic
    layout:
      _if:
        test: true
        then:
          span: 12
        else:
          span: 24
`);
  assert.deepEqual(json.blocks[1].id, 'dynamic');
  assert.ok(json.blocks[1].layout._if);
  assert.ok(
    report.some((entry) => entry.action === 'dynamic' && /class: \{ _if/.test(entry.message))
  );
});

test('a skipped child closes the run so no block is moved across it', () => {
  const { json } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 12
  - id: dynamic
    layout:
      span:
        _state: span
  - id: b
    layout:
      span: 12
`);
  assert.deepEqual(
    json.blocks.map((block) => block.id),
    ['home_grid_1', 'dynamic', 'home_grid_2']
  );
});

test('responsive breakpoint layout is reported, never guessed at', () => {
  const { json, report } = run(`
id: home
blocks:
  - id: a
    layout:
      span: 12
      md:
        span: 8
`);
  assert.deepEqual(json.blocks[0].id, 'a');
  assert.ok(report.some((entry) => entry.action === 'manual' && /layout.md/.test(entry.message)));
});

test('generated container ids are namespaced under the parent block id', () => {
  const { json } = run(`
id: page.section
blocks:
  - id: a
    layout:
      span: 12
`);
  assert.equal(json.blocks[0].id, 'page.section_grid_1');
});

test('comments on untouched nodes survive the rewrite', () => {
  const { yaml } = run(`
# The dashboard page
id: home
type: Box
blocks:
  # The left hand column
  - id: left
    type: Box # keeps its trailing note
    layout:
      span: 8
`);
  assert.match(yaml, /# The dashboard page/);
  assert.match(yaml, /# The left hand column/);
  assert.match(yaml, /# keeps its trailing note/);
});

test('classes are appended to an existing class string', () => {
  const { json } = run(`
id: home
blocks:
  - id: a
    class: rounded shadow
    layout:
      span: 12
`);
  assert.equal(json.blocks[0].blocks[0].class, 'rounded shadow col-span-12');
});

test('a nested container is rewritten before its parent moves it', () => {
  const { json } = run(`
id: home
blocks:
  - id: card
    type: Box
    layout:
      span: 12
    blocks:
      - id: inner
        layout:
          grow: 1
`);
  const grid = json.blocks[0];
  assert.equal(grid.type, 'Grid');
  const card = grid.blocks[0];
  assert.equal(card.class, 'col-span-12');
  assert.equal(card.blocks[0].type, 'Row');
  assert.equal(card.blocks[0].id, 'card_row_1');
});

test('a page with no layout keys is returned unchanged with an empty report', () => {
  const source = `
id: home
type: Box
blocks:
  - id: a
    type: Box
`;
  const { yaml, report } = run(source);
  assert.equal(yaml, source.replace(/^\n/, ''));
  assert.deepEqual(report, []);
});
