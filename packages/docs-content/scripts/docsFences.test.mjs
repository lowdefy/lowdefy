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

// cause: 'docs'     - the example is wrong; the schema is right.
//        'schema'   - the plugin accepts what the docs show; its schema is too
//                     narrow, so the documented config fails a real build.
//        'obsolete' - a migration page showing config from the version being
//                     migrated away from. Deliberately no longer valid.
const knownMismatches = [
  // PageHeaderMenu has no `title` property (its meta declares logo, header,
  // footer, content, breadcrumb, menu*, notifications, profile, darkModeToggle,
  // localeSelector, theme). The tutorial is the first config a new user copies.
  ...[
    'content/agents/agent-server-hooks.md',
    'content/agents/agents-introduction.md',
    'content/concepts/connections-and-requests.md',
    'content/concepts/lowdefy-schema.md',
    'content/display-blocks/markdownwithcode.md',
    'content/tutorial/tutorial-create-page.md',
    'content/tutorial/tutorial-display-data-page.md',
    'content/tutorial/tutorial-requests-api.md',
    'content/tutorial/tutorial-requests-sql.md',
    'content/tutorial/tutorial-start.md',
  ].map((file) => ({
    cause: 'docs',
    file,
    problem: 'PageHeaderMenu properties/ must NOT have additional properties ("title")',
  })),

  // Typography blocks take `style` as a block key, not a property. Written under
  // `properties` it is silently dropped, which is the failure mode this scan
  // exists to surface.
  ...[
    ['content/container-blocks/content.md', 'Title'],
    ['content/container-blocks/footer.md', 'Paragraph'],
    ['content/container-blocks/layout.md', 'Title'],
    ['content/container-blocks/mobilemenu.md', 'Paragraph'],
    ['content/container-blocks/pageheadermenu.md', 'Paragraph'],
    ['content/container-blocks/pagesidebarlayout.md', 'Paragraph'],
    ['content/container-blocks/pagesidermenu.md', 'Paragraph'],
  ].map(([file, blockType]) => ({
    cause: 'docs',
    file,
    problem: `${blockType} properties/ must NOT have additional properties ("style")`,
  })),

  // label.extraStyle was replaced by label.extra; the _ref and _var pages still
  // show the old key.
  ...['content/operators/_ref.md', 'content/operators/_var.md'].flatMap((file) =>
    ['NumberInput', 'TextInput'].map((blockType) => ({
      cause: 'docs',
      file,
      problem: `${blockType} properties/label must NOT have additional properties ("extraStyle")`,
    }))
  ),

  // auth.providers / auth.callbacks, written at the config root.
  {
    cause: 'docs',
    file: 'content/callback-reference/auth0logoutcallback.md',
    problem: 'lowdefy.yaml/ must NOT have additional properties ("callbacks")',
  },
  {
    cause: 'docs',
    file: 'content/callback-reference/auth0logoutcallback.md',
    problem: 'lowdefy.yaml/ must NOT have additional properties ("providers")',
  },
  {
    cause: 'docs',
    file: 'content/provider-reference/openidconnectprovider.md',
    problem: 'lowdefy.yaml/ must NOT have additional properties ("providers")',
  },
  // The page's own prose says auth.api.roles; the example indents `api` under
  // `pages`.
  {
    cause: 'docs',
    file: 'content/user-authentication/roles.md',
    problem: 'lowdefy.yaml/auth/pages must NOT have additional properties ("api")',
  },
  // `blocks:` given as a mapping instead of an array of blocks.
  {
    cause: 'docs',
    file: 'content/concepts/page-and-app-state.md',
    problem: 'lowdefy.yaml/pages/0/blocks Block "blocks" should be an array.',
  },
  // Result.status is a string enum; `404` unquoted is a number in yaml.
  ...['must be string', 'must be equal to one of the allowed values'].map((message) => ({
    cause: 'docs',
    file: 'content/migration/v3-to-v4.md',
    problem: `Result properties/status ${message}`,
  })),
  // `template: {{ ... }}` unquoted parses as a yaml flow mapping, not a string.
  {
    cause: 'docs',
    file: 'content/operators/_nunjucks.md',
    problem: '_nunjucks params/ must match exactly one schema in oneOf',
  },
  // The page documents `_menu: { value: <index> }` for an index lookup; the
  // schema spells the index branch `index` and types `value` as a string.
  {
    cause: 'docs',
    file: 'content/operators/_menu.md',
    problem: '_menu params/ must match exactly one schema in oneOf',
  },
  // Deliberately looks a key up that is not there, to show `default`. Its `key`
  // is outside the schema's enum for that reason.
  {
    cause: 'docs',
    file: 'content/operators/_media.md',
    problem: '_media params/ must match exactly one schema in oneOf',
  },

  // _not is `!params` - it negates any value, and the page documents `_not: 100`.
  {
    cause: 'schema',
    file: 'content/operators/_not.md',
    problem: '_not params/ must be boolean',
  },
  // The page documents `_index: true` for "all indices"; the schema allows only
  // an integer.
  {
    cause: 'schema',
    file: 'content/operators/_index.md',
    problem: '_index params/ must be integer',
  },
  // The page documents `_secret: true` and `_secret: { all: true }`; the schema
  // has neither branch, unlike _media and _menu which do.
  {
    cause: 'schema',
    file: 'content/operators/_secret.md',
    problem: '_secret params/ must match exactly one schema in oneOf',
  },
  // knex accepts an array search path and the page documents one.
  {
    cause: 'schema',
    file: 'content/connections/postgresql.md',
    problem: 'Knex properties/searchPath Knex connection property "searchPath" should be a string.',
  },
  // The page documents `customers: { list: { limit: 30 } }`; the schema requires
  // the method's arguments as an array or null.
  ...[
    'StripeRequest properties/customers StripeRequest resource should only contain a method to call, or sub-resource with a method to call.',
    'StripeRequest properties/customers/list Should be an array of parameters or null.',
    'StripeRequest properties/customers/list/limit must be array,null',
  ].map((problem) => ({ cause: 'schema', file: 'content/connections/stripe.md', problem })),

  // The "Before (v4)" half of a v4 -> v5 migration example.
  ...['bodyStyle', 'headerStyle'].map((property) => ({
    cause: 'obsolete',
    file: 'content/migration/v4-to-v5.md',
    problem: `Card properties/ must NOT have additional properties ("${property}")`,
  })),
];

// extractAgentDocs writes some example values with String(), leaving the literal
// `[object Object]` in the fence. Those fences carry no config. The count is
// pinned so the defect can shrink but not spread.
const STRINGIFIED_OBJECT_FENCES = 676;

// Fences whose opening ``` is never closed, so the rest of the page renders
// inside a code block. Extraction defects like the one above; pinned, not fixed.
const UNTERMINATED_FENCES = [
  'content/concepts/connections-and-requests.md:411',
  'content/concepts/layout-overview.md:253',
  'content/deployment/node-server.md:19',
  'content/display-blocks/markdownwithcode.md:716',
];

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

test('the [object Object] extraction defect does not spread to more fences', () => {
  assert.ok(
    scan.counts.stringifiedObjects <= STRINGIFIED_OBJECT_FENCES,
    `${scan.counts.stringifiedObjects} fences hold a stringified object, up from ${STRINGIFIED_OBJECT_FENCES}`
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
