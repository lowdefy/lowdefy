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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { serializer } from '@lowdefy/helpers';

import makeId from '../../../utils/makeId.js';
import rekeyInstance from './rekeyInstance.js';
import setNonEnumerableProperty from '../../../utils/setNonEnumerableProperty.js';

function keyed(node, key) {
  setNonEnumerableProperty(node, '~k', key);
  return node;
}

beforeEach(() => {
  makeId.reset();
  // The keys addKeys issues are base36 counter values; start past the template
  // keys the tests write by hand so a fresh key is never mistaken for one.
  makeId.setCounter(1000);
});

test('rekeyInstance gives every cloned node a key of its own', () => {
  const keyMap = {
    t1: { key: 'root.components.Pill.blocks[0:wrap]', '~r': 'ref1', '~l': 3 },
    t2: { key: 'root.components.Pill.blocks[0:wrap].properties', '~r': 'ref1', '~l': 5 },
  };
  const tree = [keyed({ id: 'wrap', properties: keyed({ title: 'a' }, 't2') }, 't1')];

  rekeyInstance({ tree, instanceKey: 'i1', keyMap });

  const blockKey = tree[0]['~k'];
  const propertiesKey = tree[0].properties['~k'];
  expect(blockKey).not.toBe('t1');
  expect(propertiesKey).not.toBe('t2');
  expect(keyMap[blockKey]).toEqual({
    key: 'root.components.Pill.blocks[0:wrap]',
    '~r': 'ref1',
    '~l': 3,
    '~k_parent': 'i1',
    '~k_source': 't1',
  });
  expect(keyMap[propertiesKey]).toEqual({
    key: 'root.components.Pill.blocks[0:wrap].properties',
    '~r': 'ref1',
    '~l': 5,
    '~k_parent': blockKey,
    '~k_source': 't2',
  });
});

test('rekeyInstance keys a cloned array node', () => {
  const keyMap = { t1: { key: 'root.components.Pill.blocks', '~l': 2 } };
  const blocks = keyed([{ id: 'wrap' }], 't1');
  const tree = { blocks };

  rekeyInstance({ tree, instanceKey: 'i1', keyMap });

  expect(blocks['~k']).not.toBe('t1');
  expect(keyMap[blocks['~k']]['~k_source']).toBe('t1');
});

test('rekeyInstance gives two instances of one template disjoint keys', () => {
  const keyMap = { t1: { key: 'root.components.Pill.blocks[0:wrap]', '~l': 3 } };
  const template = keyed({ id: 'wrap' }, 't1');
  const a = serializer.copy(template);
  const b = serializer.copy(template);

  rekeyInstance({ tree: [a], instanceKey: 'i1', keyMap });
  rekeyInstance({ tree: [b], instanceKey: 'i2', keyMap });

  expect(a['~k']).not.toBe(b['~k']);
  expect(keyMap[a['~k']]['~k_parent']).toBe('i1');
  expect(keyMap[b['~k']]['~k_parent']).toBe('i2');
  expect(keyMap[a['~k']]['~k_source']).toBe('t1');
  expect(keyMap[b['~k']]['~k_source']).toBe('t1');
});

test('rekeyInstance carries the template ~ignoreBuildChecks onto the instance', () => {
  const keyMap = {
    t1: { key: 'root.components.Pill.blocks[0:wrap]', '~ignoreBuildChecks': ['x'] },
  };
  const tree = [keyed({ id: 'wrap' }, 't1')];

  rekeyInstance({ tree, instanceKey: 'i1', keyMap });

  expect(keyMap[tree[0]['~k']]['~ignoreBuildChecks']).toEqual(['x']);
});

test('rekeyInstance names the authored node when a clone is cloned again', () => {
  const keyMap = {
    t1: { key: 'root.components.Pill.blocks[0:wrap]', '~l': 3 },
  };
  const tree = [keyed({ id: 'wrap' }, 't1')];

  rekeyInstance({ tree, instanceKey: 'i1', keyMap });
  const firstKey = tree[0]['~k'];
  rekeyInstance({ tree, instanceKey: 'i2', keyMap });

  expect(keyMap[tree[0]['~k']]['~k_source']).toBe('t1');
  expect(tree[0]['~k']).not.toBe(firstKey);
});

test('rekeyInstance leaves a skipped slot filler and its subtree keyed as authored', () => {
  const keyMap = {
    t1: { key: 'root.components.Pill.blocks[0:wrap]', '~l': 3 },
    u1: { key: 'root.pages[0:home].blocks[0:approve]', '~l': 11 },
    u2: { key: 'root.pages[0:home].blocks[0:approve].properties', '~l': 12 },
  };
  const filler = keyed({ id: 'approve', properties: keyed({ title: 'Approve' }, 'u2') }, 'u1');
  const tree = [keyed({ id: 'wrap' }, 't1'), filler];

  rekeyInstance({ tree, instanceKey: 'i1', keyMap, skip: new Set([filler]) });

  expect(filler['~k']).toBe('u1');
  expect(filler.properties['~k']).toBe('u2');
  expect(tree[0]['~k']).not.toBe('t1');
});

test('rekeyInstance keys a node whose template key is not in this build keyMap', () => {
  const keyMap = {};
  const tree = [keyed({ id: 'wrap' }, 'stale')];

  rekeyInstance({ tree, instanceKey: 'i1', keyMap });

  expect(tree[0]['~k']).not.toBe('stale');
  expect(keyMap[tree[0]['~k']]).toEqual({ '~k_parent': 'i1', '~k_source': 'stale' });
});

// The closure emitter (V-57) keys a page's operator sites by ~k, so one key
// naming two structurally different sites makes a page unemittable. Assert it
// over the built artefacts rather than over the expansion code alone.
const successDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../tests/success'
);

function collectKeys(node, keys = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectKeys(item, keys));
    return keys;
  }
  if (node === null || typeof node !== 'object') return keys;
  if (typeof node['~k'] === 'string') keys.push(node['~k']);
  Object.keys(node).forEach((key) => collectKeys(node[key], keys));
  return keys;
}

test('no page artefact in the build success fixtures reuses a ~k', () => {
  const duplicates = [];
  fs.readdirSync(successDirectory)
    .sort()
    .forEach((fixture) => {
      const snapshotPath = path.join(successDirectory, fixture, 'snapshot.json');
      if (!fs.existsSync(snapshotPath)) return;
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      Object.keys(snapshot)
        .filter((artefact) => artefact.startsWith('pages/'))
        .forEach((artefact) => {
          const counts = new Map();
          collectKeys(snapshot[artefact]).forEach((key) =>
            counts.set(key, (counts.get(key) ?? 0) + 1)
          );
          [...counts]
            .filter(([, count]) => count > 1)
            .forEach(([key, count]) =>
              duplicates.push(`${fixture}/${artefact}: "${key}" used ${count} times`)
            );
        });
    });
  expect(duplicates).toEqual([]);
});
