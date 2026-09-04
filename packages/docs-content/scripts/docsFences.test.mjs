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

import { FRAGMENT_MARKER, isFragment, readFences, scanDocsFences } from './docsFenceSchemas.mjs';

// Docs examples are the config readers copy, so they are held to the plugin
// schemas the build holds an app to. What this catches is drift: a block meta
// drops a property, an operator schema narrows, and the docs go on showing the
// old spelling. The schemas are read from the plugin packages on every run, so
// the check moves with them.
//
// Mismatches that exist today are recorded below with the reason each one is
// wrong. The list is closed in both directions - an unrecorded mismatch fails,
// and a recorded one that has been fixed fails as stale - so it cannot grow
// quietly and cannot rot, the same contract as blocks-antd's
// no-deprecated-antd-props scan.

// The list is empty: every mismatch it recorded has been paid. A migration page's
// "before" example now shows the keys it is migrating rather than a whole block,
// so it claims no schema; the page for the removed Auth0LogoutCallback is gone
// with the feature; and _media's default example uses a key the operator has.
const knownMismatches = [];

// extractAgentDocs renders every example value as yaml, so no fence is left
// holding the literal `[object Object]` that String() used to write.
const STRINGIFIED_OBJECT_FENCES = 0;

// Fences whose opening ``` is never closed, so the rest of the page renders
// inside a code block. None remain: the scanner and the docs sources both match
// fence lengths, so a fence nested inside an example no longer closes its
// wrapper.
const UNTERMINATED_FENCES = [];

const scan = await scanDocsFences();

function describeMismatch({ file, problem }) {
  return `${file} :: ${problem}`;
}

test('every yaml fence validates against the plugin schema it claims', () => {
  const recorded = new Set(knownMismatches.map(describeMismatch));
  const unexpected = scan.failures.filter((failure) => !recorded.has(describeMismatch(failure)));
  assert.deepEqual(
    unexpected.map(
      (failure) => `${failure.file}:${failure.line} ${failure.node} ${failure.problem}`
    ),
    []
  );
});

test('every recorded docs-schema mismatch is still present, so the list does not rot', () => {
  const found = new Set(scan.failures.map(describeMismatch));
  const stale = knownMismatches.filter((mismatch) => !found.has(describeMismatch(mismatch)));
  assert.deepEqual(stale.map(describeMismatch), []);
});

// A scanner that stops finding fences, or a schema load that quietly returns
// nothing, would make the check above pass while testing nothing. These floors
// sit below the current counts by enough that ordinary docs edits do not move
// them, and are tripped by a regression that empties the scan.
test('the scan reaches the whole docs corpus', () => {
  assert.ok(scan.counts.yamlFences > 3000, `only ${scan.counts.yamlFences} yaml fences read`);
  assert.ok(scan.counts.nodes.block > 6000, `only ${scan.counts.nodes.block} block nodes checked`);
  assert.ok(
    scan.counts.nodes.operator > 1200,
    `only ${scan.counts.nodes.operator} operator nodes checked`
  );
  assert.ok(
    scan.counts.nodes.request > 200,
    `only ${scan.counts.nodes.request} request nodes checked`
  );
  assert.ok(
    scan.counts.nodes.connection > 50,
    `only ${scan.counts.nodes.connection} connection nodes checked`
  );
});

test('every installed plugin package contributes its schemas to the scan', () => {
  assert.ok(Object.keys(scan.schemas.blocks).length > 120);
  assert.ok(Object.keys(scan.schemas.operators).length > 60);
  assert.ok(Object.keys(scan.schemas.requests).length > 30);
  assert.ok(Object.keys(scan.schemas.connections).length > 10);
});

test('no fence holds a stringified object instead of the example config', () => {
  assert.equal(
    scan.counts.stringifiedObjects,
    STRINGIFIED_OBJECT_FENCES,
    `${scan.counts.stringifiedObjects} fences hold a stringified object`
  );
});

test('no markdown fence beyond the recorded set is left unterminated', () => {
  assert.deepEqual(
    scan.unterminated.filter((location) => !UNTERMINATED_FENCES.includes(location)),
    []
  );
});

test('readFences pairs a fence whose closing backticks share a line with its body', () => {
  const fences = readFences({
    markdown: ['```yaml', 'id: a', '```', '', '```yaml', '[object Object]```', ''].join('\n'),
  });
  assert.equal(fences.length, 2);
  assert.deepEqual(
    fences.map((fence) => fence.body),
    ['id: a', '[object Object]']
  );
});

test('readFences closes a fence only on a backtick run as long as its opener', () => {
  const fences = readFences({
    markdown: [
      '````yaml',
      'content: |',
      '  ```yaml',
      '  id: inner',
      '  ```',
      '````',
      '',
      '```yaml',
      'id: after',
      '```',
    ].join('\n'),
  });
  assert.equal(fences.length, 2);
  assert.deepEqual(
    fences.map((fence) => fence.body),
    ['content: |\n  ```yaml\n  id: inner\n  ```', 'id: after']
  );
});

test('a fence marked as a fragment opts out of validation', () => {
  assert.equal(isFragment({ body: `${FRAGMENT_MARKER}\nproperties:\n  title: a` }), true);
  assert.equal(isFragment({ body: 'id: a\ntype: Box' }), false);
  // No fence needs the marker today: a fence is only validated where it claims a
  // schema, so a fragment with no type, no operator root and no lowdefy version
  // is already skipped by shape.
  assert.equal(scan.counts.fragments, 0);
});

test('readFences reports an opening fence that is never closed', () => {
  const fences = readFences({ markdown: ['# Title', '```yaml', 'id: a'].join('\n') });
  assert.equal(fences.length, 1);
  assert.equal(fences[0].unterminated, true);
});
