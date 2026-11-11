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

import { expect, test } from 'vitest';

import createColumnarKeyMap from './createColumnarKeyMap.js';
import createKeyPathResolver from './createKeyPathResolver.js';
import encodeColumnarKeyMap from './encodeColumnarKeyMap.js';
import resolveConfigLocation from './resolveConfigLocation.js';
import resolveKeyEntry from './resolveKeyEntry.js';
import shouldSuppressBuildCheck from './shouldSuppressBuildCheck.js';

// A short-shape key map with base-36 counter ids, as a full build writes it.
// The root's parent id (1) is never written, as addKeys leaves it; id 9 is
// skipped, so the columns have a gap; ids past 9 are two characters long.
const keyMap = {
  2: { s: 'root', p: '1' },
  3: { s: '.pages', p: '2', r: 'refPages', l: 3 },
  4: { s: '[0:home]', p: '3', l: 4 },
  5: { s: '.blocks', p: '4', l: 6 },
  6: { s: '[0:header]', p: '5', l: 7 },
  7: { s: '[2:my_button:Button]', p: '5', r: 'refButton', l: 2, i: ['state-refs'] },
  8: { s: '.events.onMountAsync', p: '6', r: null },
  a: { s: '.blocks', p: '6', l: 11 },
  b: { s: '[0:header]', p: 'a', l: 12 },
};
const refMap = {
  refPages: { path: 'pages/home.yaml' },
  refButton: { path: 'blocks/button.yaml', parent: 'refPages' },
};

// The columns go through JSON, as the server reads them from keyMap.json.gz.
function columnar(map) {
  return createColumnarKeyMap(JSON.parse(JSON.stringify(encodeColumnarKeyMap({ keyMap: map }))));
}

test('a columnar key map returns every entry as the plain map holds it', () => {
  const columns = columnar(keyMap);
  for (const id of Object.keys(keyMap)) {
    if (id === '2') continue;
    expect(columns.get(id)).toEqual(keyMap[id]);
  }
});

test('a columnar key map returns an entry whose parent is not in the map without a parent', () => {
  expect(columnar(keyMap).get('2')).toEqual({ s: 'root' });
});

test('every key resolves to the same location from a columnar key map as from the plain map', () => {
  const columns = columnar(keyMap);
  for (const configKey of Object.keys(keyMap)) {
    for (const configDirectory of [undefined, '/app']) {
      const plain = resolveConfigLocation({ configKey, keyMap, refMap, configDirectory });
      expect(plain).not.toBeNull();
      expect(
        resolveConfigLocation({ configKey, keyMap: columns, refMap, configDirectory })
      ).toEqual(plain);
    }
  }
});

test('resolveKeyEntry gives the same path, ref, line and ignored checks from a columnar key map', () => {
  const columns = columnar(keyMap);
  for (const configKey of Object.keys(keyMap)) {
    const { parentId, ...plain } = resolveKeyEntry({ keyMap, configKey });
    const fromColumns = resolveKeyEntry({ keyMap: columns, configKey });
    expect({ ...fromColumns, parentId: undefined }).toEqual({ ...plain, parentId: undefined });
  }
  expect(resolveKeyEntry({ keyMap: columns, configKey: '7' })).toEqual({
    path: 'root.pages[0:home].blocks[2:my_button:Button]',
    refId: 'refButton',
    line: 2,
    parentId: '5',
    ignoreBuildChecks: ['state-refs'],
  });
});

test('createKeyPathResolver resolves every key of a columnar key map as of the plain map', () => {
  const plain = createKeyPathResolver({ keyMap });
  const fromColumns = createKeyPathResolver({ keyMap: columnar(keyMap) });
  for (const configKey of Object.keys(keyMap)) {
    expect(fromColumns(configKey).path).toEqual(plain(configKey).path);
    expect(fromColumns(configKey).refId).toEqual(plain(configKey).refId);
  }
});

test('shouldSuppressBuildCheck finds an ancestor ignore in a columnar key map', () => {
  const columns = columnar(keyMap);
  expect(shouldSuppressBuildCheck({ configKey: '7', checkSlug: 'state-refs' }, columns)).toBe(true);
  expect(shouldSuppressBuildCheck({ configKey: '6', checkSlug: 'state-refs' }, columns)).toBe(
    false
  );
});

test.each([['9'], ['1'], ['zz'], ['k_missing'], ['07'], [''], [null], [undefined]])(
  'a columnar key map has no entry for id %j',
  (id) => {
    const columns = columnar(keyMap);
    expect(columns.get(id)).toBeUndefined();
    expect(resolveConfigLocation({ configKey: id, keyMap: columns, refMap })).toBeNull();
  }
);

test('an empty key map encodes to empty columns that hold no entry', () => {
  const columns = encodeColumnarKeyMap({ keyMap: {} });
  expect(columns).toEqual({
    base: 0,
    segments: [],
    segment: [],
    parent: [],
    line: [],
    refs: [],
    ignoreBuildChecks: [],
  });
  expect(createColumnarKeyMap(columns).get('1')).toBeUndefined();
});

test('encodeColumnarKeyMap stores each distinct segment once', () => {
  const columns = encodeColumnarKeyMap({ keyMap });
  expect(columns.segments).toEqual([
    'root',
    '.pages',
    '[0:home]',
    '.blocks',
    '[0:header]',
    '[2:my_button:Button]',
    '.events.onMountAsync',
  ]);
  expect(columns.base).toBe(2);
  expect(columns.segment[7]).toBe(-1);
});

test('encodeColumnarKeyMap throws on an id that is not a base-36 counter id', () => {
  expect(() => encodeColumnarKeyMap({ keyMap: { ab12_3: { s: 'root', p: 'ab12_2' } } })).toThrow(
    'Key map id "ab12_3" is not a base-36 counter id, so it has no column.'
  );
  expect(() => encodeColumnarKeyMap({ keyMap: { '01': { s: 'root', p: '0' } } })).toThrow(
    'Key map id "01" is not a base-36 counter id, so it has no column.'
  );
});

test('encodeColumnarKeyMap throws on an entry in the full shape', () => {
  expect(() => encodeColumnarKeyMap({ keyMap: { 1: { key: 'root', '~k_parent': '0' } } })).toThrow(
    'Key map entry "1" is not in the short shape, so it has no column.'
  );
});
