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

import { serializer } from '@lowdefy/helpers';

import applyMutant from './applyMutant.js';
import hashArtifact from './hashArtifact.js';
import listMutants from './listMutants.js';
import mutantId from './mutantId.js';
import positionFreePath from './positionFreePath.js';
import collectSharedIds from './collectSharedIds.js';
import keyArtifact from './test/keyArtifact.mjs';
import { pageFixture } from './test/fixtures.mjs';

function reader(artifacts) {
  return async (name) => artifacts[name] ?? null;
}

async function listPage({ prefix, value }) {
  const { root, keyMap } = value ? keyArtifact({ value, prefix }) : pageFixture({ prefix });
  return listMutants({
    pages: ['tickets'],
    readConfigFile: reader({ 'pages/tickets.json': root }),
    keyMap,
    refMap: {},
  });
}

test('positionFreePath drops the index of every item with an id and keeps id-less items', () => {
  expect(
    positionFreePath({
      configPath:
        'root.pages[0:tickets:PageHeaderMenu].blocks[3:assign_submit:Button].events.onClick[1:assign:Request]',
    })
  ).toEqual(
    'root.pages[tickets:PageHeaderMenu].blocks[assign_submit:Button].events.onClick[assign:Request]'
  );
  expect(positionFreePath({ configPath: 'root.blocks[2:name:TextInput].validate[0]' })).toEqual(
    'root.blocks[name:TextInput].validate[0]'
  );
});

test('positionFreePath keeps the index of siblings that share an id', () => {
  const keyMap = {
    a: { key: 'root.blocks[0:box:Box].events.onClick[0:set:SetState]' },
    b: { key: 'root.blocks[0:box:Box].events.onClick[1:set:SetState]' },
    c: { key: 'root.blocks[0:box:Box]' },
  };
  const sharedIds = collectSharedIds({ keyMap });
  expect(positionFreePath({ configPath: keyMap.a.key, sharedIds })).toEqual(
    'root.blocks[box:Box].events.onClick[0:set:SetState]'
  );
  expect(positionFreePath({ configPath: keyMap.b.key, sharedIds })).toEqual(
    'root.blocks[box:Box].events.onClick[1:set:SetState]'
  );
});

test('mutantId is 12 hex characters and changes with the operator and arg', () => {
  const base = {
    artifact: 'pages/a.json',
    configPath: 'root.blocks[x:Box]',
    operator: 'drop-block',
  };
  expect(mutantId(base)).toMatch(/^[0-9a-f]{12}$/);
  expect(mutantId({ ...base, operator: 'flip-visible', arg: 'visible' })).not.toEqual(
    mutantId(base)
  );
});

test('mutant ids are equal across two builds of unchanged config whose ~k prefixes differ', async () => {
  const first = await listPage({ prefix: 'aaaa_1_' });
  const second = await listPage({ prefix: 'bbbb_9_' });
  expect(first.mutants.map((mutant) => mutant.key)).not.toEqual(
    second.mutants.map((mutant) => mutant.key)
  );
  expect(first.mutants.map((mutant) => mutant.id)).toEqual(
    second.mutants.map((mutant) => mutant.id)
  );
  expect(new Set(first.mutants.map((mutant) => mutant.id)).size).toEqual(first.mutants.length);
});

function simplePage(blocks) {
  return {
    id: 'page:tickets',
    type: 'Box',
    pageId: 'tickets',
    blockId: 'tickets',
    slots: { content: { blocks } },
  };
}

test('a mutant keeps its id when a block is inserted above its node', async () => {
  const before = await listPage({
    prefix: 'p1_',
    value: simplePage([{ id: 'block:tickets:save', blockId: 'save', type: 'Button' }]),
  });
  const after = await listPage({
    prefix: 'p2_',
    value: simplePage([
      { id: 'block:tickets:intro', blockId: 'intro', type: 'Paragraph' },
      { id: 'block:tickets:save', blockId: 'save', type: 'Button' },
    ]),
  });
  const saveBefore = before.mutants.find((mutant) => mutant.describe.includes('"save"'));
  const saveAfter = after.mutants.find((mutant) => mutant.describe.includes('"save"'));
  expect(saveAfter.id).toEqual(saveBefore.id);
});

test('siblings sharing an id get distinct mutant ids', async () => {
  const { mutants } = await listPage({
    prefix: 's_',
    value: simplePage([
      {
        id: 'block:tickets:save',
        blockId: 'save',
        type: 'Button',
        events: {
          onClick: {
            try: [
              { id: 'set', type: 'SetState', params: { a: 1 } },
              { id: 'set', type: 'SetState', params: { b: 2 } },
            ],
          },
        },
      },
    ]),
  });
  const ids = mutants
    .filter((mutant) => mutant.operator === 'drop-action')
    .map((mutant) => mutant.id);
  expect(ids).toHaveLength(2);
  expect(ids[0]).not.toEqual(ids[1]);
});

test('listMutants answers each mutant with its anchor, source, config and the artifact hash', async () => {
  const { root, keyMap } = pageFixture();
  Object.values(keyMap).forEach((entry) => {
    entry['~r'] = 'pageRef';
    entry['~l'] = 7;
  });
  const result = await listMutants({
    pages: ['tickets'],
    operators: ['drop-block'],
    readConfigFile: reader({ 'pages/tickets.json': root }),
    keyMap,
    refMap: { pageRef: { path: 'pages/tickets.yaml' } },
  });
  expect(result.artifacts).toEqual({ 'pages/tickets.json': hashArtifact(root) });
  expect(result.mutants[0]).toEqual({
    id: expect.stringMatching(/^[0-9a-f]{12}$/),
    operator: 'drop-block',
    artifact: 'pages/tickets.json',
    key: root.slots.content.blocks[0]['~k'],
    arg: null,
    anchor: { type: 'block', pageId: 'tickets', blockId: 'title', parentBlockId: 'tickets' },
    source: 'pages/tickets.yaml:7',
    config: 'root.slots.content.blocks[0:title:Title]',
    describe: 'drop-block Title "title" from tickets',
    copies: [],
    copyTargets: [],
    pointer: ['slots', 'content', 'blocks', 0],
    nodeHash: expect.stringMatching(/^[0-9a-f]{40}$/),
  });
});

test('source resolves through a module ref to the real file and line', async () => {
  const { root, keyMap } = pageFixture();
  Object.values(keyMap).forEach((entry) => {
    entry['~r'] = 'moduleInvocation';
    entry['~l'] = 42;
  });
  const { mutants } = await listMutants({
    pages: ['tickets'],
    operators: ['drop-block'],
    readConfigFile: reader({ 'pages/tickets.json': root }),
    keyMap,
    refMap: {
      moduleInvocation: { parent: 'moduleFile' },
      moduleFile: { path: 'modules/tickets/pages/tickets.yaml', parent: null },
    },
  });
  expect(mutants[0].source).toEqual('modules/tickets/pages/tickets.yaml:42');
});

function layoutPage({ pageId, footerText }) {
  return {
    id: `page:${pageId}`,
    type: 'Box',
    pageId,
    blockId: pageId,
    slots: {
      content: {
        blocks: [
          {
            id: `block:${pageId}:footer`,
            blockId: 'footer',
            type: 'Paragraph',
            properties: { content: footerText },
          },
        ],
      },
    },
  };
}

test("copies of one _ref'd node on three pages group into one mutant with two copies", async () => {
  const artifacts = {};
  const keyMap = {};
  ['orders', 'contacts', 'tickets'].forEach((pageId, index) => {
    const { root } = keyArtifact({
      value: layoutPage({ pageId, footerText: 'Made with care' }),
      prefix: `l${index}_`,
      keyMap,
    });
    artifacts[`pages/${pageId}.json`] = root;
  });
  // The footer came from one layout file, at one line, on every page.
  Object.values(keyMap).forEach((entry) => {
    if (entry.key.endsWith('[0:footer:Paragraph]')) {
      entry['~r'] = 'layout';
      entry['~l'] = 3;
    }
  });
  const { mutants } = await listMutants({
    pages: ['tickets', 'orders', 'contacts'],
    operators: ['drop-block'],
    readConfigFile: reader(artifacts),
    keyMap,
    refMap: { layout: { path: 'layouts/footer.yaml' } },
  });
  expect(mutants).toHaveLength(1);
  expect(mutants[0].anchor.pageId).toEqual('contacts');
  expect(mutants[0].copies).toEqual(['orders', 'tickets']);
  // Each copy carries its own page's key, so a journey on that page runs its copy.
  expect(mutants[0].copyTargets).toEqual(
    ['orders', 'tickets'].map((pageId) => ({
      artifact: `pages/${pageId}.json`,
      key: artifacts[`pages/${pageId}.json`].slots.content.blocks[0]['~k'],
      pointer: ['slots', 'content', 'blocks', 0],
      anchor: { type: 'block', pageId, blockId: 'footer', parentBlockId: pageId },
    }))
  );
  expect(mutants[0].key).toBe(artifacts['pages/contacts.json'].slots.content.blocks[0]['~k']);
});

test('ids lists every copy of a grouped mutant, so a copy kept by an earlier listing is found', async () => {
  const artifacts = {};
  const keyMap = {};
  ['orders', 'tickets'].forEach((pageId, index) => {
    artifacts[`pages/${pageId}.json`] = keyArtifact({
      value: layoutPage({ pageId, footerText: 'Made with care' }),
      prefix: `i${index}_`,
      keyMap,
    }).root;
  });
  const both = await listMutants({
    pages: ['orders', 'tickets'],
    operators: ['drop-block'],
    readConfigFile: reader(artifacts),
    keyMap,
    refMap: {},
  });
  const ticketsOnly = await listMutants({
    pages: ['tickets'],
    operators: ['drop-block'],
    readConfigFile: reader(artifacts),
    keyMap,
    refMap: {},
  });
  const footer = (listing) => listing.mutants.find(({ describe }) => describe.includes('footer'));
  expect(footer(both).id).not.toBe(footer(ticketsOnly).id);
  expect(both.ids).toContain(footer(ticketsOnly).id);
  expect(both.ids).toContain(footer(both).id);
});

test('two template copies with different content stay two mutants', async () => {
  const artifacts = {};
  const keyMap = {};
  [
    ['orders', 'Orders footer'],
    ['tickets', 'Tickets footer'],
  ].forEach(([pageId, footerText], index) => {
    artifacts[`pages/${pageId}.json`] = keyArtifact({
      value: layoutPage({ pageId, footerText }),
      prefix: `t${index}_`,
      keyMap,
    }).root;
  });
  Object.values(keyMap).forEach((entry) => {
    if (entry.key.endsWith('[0:footer:Paragraph]')) {
      entry['~r'] = 'template';
      entry['~l'] = 3;
    }
  });
  const { mutants } = await listMutants({
    pages: ['orders', 'tickets'],
    operators: ['drop-block'],
    readConfigFile: reader(artifacts),
    keyMap,
    refMap: { template: { path: 'templates/footer.yaml' } },
  });
  expect(mutants).toHaveLength(2);
});

test('hashArtifact is stable across a re-read and changes when the content changes', () => {
  const { root } = pageFixture();
  const reread = serializer.deserialize(serializer.serialize(root));
  expect(hashArtifact(reread)).toEqual(hashArtifact(root));
  expect(hashArtifact(pageFixture({ prefix: 'other_' }).root)).toEqual(hashArtifact(root));
  reread.slots.content.blocks[0].properties.content = 'changed';
  expect(hashArtifact(reread)).not.toEqual(hashArtifact(root));
});

test('listMutants reads requests, endpoints and app events and skips artifacts that are missing', async () => {
  const { root } = pageFixture();
  const result = await listMutants({
    pages: ['tickets', 'missing'],
    requests: [{ pageId: 'tickets', requestId: 'assign_ticket' }],
    endpoints: ['notify'],
    appEvents: true,
    readConfigFile: reader({ 'pages/tickets.json': root }),
    keyMap: {},
    refMap: {},
  });
  expect(Object.keys(result.artifacts)).toEqual(['pages/tickets.json']);
});

function requestPage({ pageId, own }) {
  return {
    id: `page:${pageId}`,
    type: 'Box',
    pageId,
    blockId: pageId,
    requests: [
      ...own.map((requestId) => ({
        id: `request:${pageId}:${requestId}`,
        requestId,
        pageId,
        payload: { filter: 'x' },
      })),
      {
        id: `request:${pageId}:unread_count`,
        requestId: 'unread_count',
        pageId,
        payload: { app_name: 'encircle' },
      },
    ],
  };
}

const requestPages = [
  ['activity', []],
  ['lapsing', ['get_a']],
  ['versions', ['get_a', 'get_b']],
];

// The pages as one build keys them: the component's request sits at a
// different position on each page, and has the same source line on all.
function buildRequestPages({ prefix }) {
  const artifacts = {};
  const keyMap = {};
  requestPages.forEach(([pageId, own], index) => {
    artifacts[`pages/${pageId}.json`] = keyArtifact({
      value: requestPage({ pageId, own }),
      prefix: `${prefix}${index}_`,
      keyMap,
    }).root;
  });
  Object.values(keyMap).forEach((entry) => {
    if (entry.key.includes(':unread_count')) {
      entry['~r'] = 'component';
      entry['~l'] = 5;
    }
  });
  return { artifacts, keyMap };
}

async function listRequestPages({ artifacts, keyMap }) {
  const { mutants } = await listMutants({
    pages: requestPages.map(([pageId]) => pageId),
    operators: ['drop-payload'],
    readConfigFile: reader(artifacts),
    keyMap,
    refMap: { component: { path: 'components/unread-count-request.yaml' } },
  });
  return mutants.find(({ arg }) => arg === 'app_name');
}

function dropAppName({ root, target, shared }) {
  return applyMutant({
    root: serializer.copy(root),
    mutant: {
      operator: 'drop-payload',
      arg: 'app_name',
      key: target.key,
      pointer: target.pointer,
      nodeHash: shared.nodeHash,
    },
  });
}

test("a request a _ref'd component adds at a different position on each page lists a key and pointer per page", async () => {
  const { artifacts, keyMap } = buildRequestPages({ prefix: 'a' });
  const shared = await listRequestPages({ artifacts, keyMap });
  expect(shared.copies).toEqual(['lapsing', 'versions']);
  const targets = [{ artifact: shared.artifact, key: shared.key, pointer: shared.pointer }].concat(
    shared.copyTargets
  );
  expect(targets.map(({ artifact }) => artifact)).toEqual([
    'pages/activity.json',
    'pages/lapsing.json',
    'pages/versions.json',
  ]);
  expect(targets.map(({ pointer }) => pointer)).toEqual([
    ['requests', 0, 'payload'],
    ['requests', 1, 'payload'],
    ['requests', 2, 'payload'],
  ]);
  targets.forEach((target) => {
    expect(dropAppName({ root: artifacts[target.artifact], target, shared })).toEqual({
      applied: true,
    });
  });
});

test('a mutant listed before its pages were rebuilt, and so re-keyed, still applies on every page by pointer', async () => {
  const listed = buildRequestPages({ prefix: 'a' });
  const shared = await listRequestPages(listed);
  // The dev server rebuilds a page when its build context is recreated and
  // issues it new keys; the config, and so the artifact's shape, is unchanged.
  const rebuilt = buildRequestPages({ prefix: 'b' });
  const targets = [{ artifact: shared.artifact, key: shared.key, pointer: shared.pointer }].concat(
    shared.copyTargets
  );
  targets.forEach((target) => {
    const root = rebuilt.artifacts[target.artifact];
    const copy = serializer.copy(root);
    expect(
      applyMutant({
        root: copy,
        mutant: { operator: 'drop-payload', arg: 'app_name', key: target.key },
      })
    ).toEqual({ applied: false, reason: 'key not found' });
    const result = dropAppName({ root, target, shared });
    expect(result).toEqual({ applied: true });
  });
});

test('a pointer into content that changed since the listing is a miss, not another node', async () => {
  const listed = buildRequestPages({ prefix: 'a' });
  const shared = await listRequestPages(listed);
  const rebuilt = buildRequestPages({ prefix: 'b' });
  const root = rebuilt.artifacts['pages/lapsing.json'];
  root.requests[1].payload.app_name = 'other';
  const target = shared.copyTargets.find(({ artifact }) => artifact === 'pages/lapsing.json');
  expect(dropAppName({ root, target, shared })).toEqual({
    applied: false,
    reason: 'key not found',
  });
  expect(root.requests[1].payload.app_name).toEqual('other');
});

test('a single-page mutant applies by its key, whatever its pointer says', async () => {
  const { root, keyMap } = pageFixture({ prefix: 'k1_' });
  const { mutants } = await listMutants({
    pages: ['tickets'],
    operators: ['drop-block'],
    readConfigFile: reader({ 'pages/tickets.json': root }),
    keyMap,
    refMap: {},
  });
  expect(mutants.length).toBeGreaterThan(0);
  mutants.forEach((mutant) => {
    expect(mutant.copyTargets).toEqual([]);
    const copy = serializer.copy(root);
    expect(
      applyMutant({
        root: copy,
        mutant: {
          operator: mutant.operator,
          arg: mutant.arg,
          key: mutant.key,
          pointer: ['no', 'such', 'node'],
          nodeHash: 'unrelated',
        },
      })
    ).toEqual({ applied: true });
  });
});
