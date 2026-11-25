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

import { expect, test, vi } from 'vitest';
import { resolveKeyEntry } from '@lowdefy/errors';

import createLazyKeyMap from './createLazyKeyMap.js';

const skeleton = {
  cfg1_1: { s: 'root', p: 'cfg1_0', r: 'ref-root' },
  cfg1_2: { s: '.pages', p: 'cfg1_1' },
};

test('a lazy key map reads the config build key map only when a lookup misses an added entry', () => {
  const readSkeletonKeyMap = vi.fn(() => skeleton);
  const keyMap = createLazyKeyMap({ readSkeletonKeyMap });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0', r: 'ref-page' };

  expect(keyMap.get('cfg1_ab_1')).toEqual({ s: 'root', p: 'cfg1_ab_0', r: 'ref-page' });
  expect(readSkeletonKeyMap).not.toHaveBeenCalled();

  expect(keyMap.get('cfg1_2')).toEqual({ s: '.pages', p: 'cfg1_1' });
  expect(keyMap.get('missing')).toBeUndefined();
  expect(readSkeletonKeyMap).toHaveBeenCalledTimes(1);
});

test('a lazy key map lists only the entries added to it', () => {
  const keyMap = createLazyKeyMap({ readSkeletonKeyMap: () => skeleton });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0' };
  keyMap.get('cfg1_1');

  expect(Object.keys(keyMap)).toEqual(['cfg1_ab_1']);
});

test('the key map readers resolve a chain from an added entry into the config build entries', () => {
  const keyMap = createLazyKeyMap({ readSkeletonKeyMap: () => skeleton });
  keyMap['cfg1_ab_1'] = { s: '[0:home:Box]', p: 'cfg1_2' };

  expect(resolveKeyEntry({ keyMap, configKey: 'cfg1_ab_1' })).toMatchObject({
    path: 'root.pages[0:home:Box]',
    refId: 'ref-root',
  });
});

test('a lazy key map with no keyMap.json resolves only the added entries', () => {
  const keyMap = createLazyKeyMap({ readSkeletonKeyMap: () => null });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0' };

  expect(keyMap.get('cfg1_1')).toBeUndefined();
  expect(keyMap.get('cfg1_ab_1')).toEqual({ s: 'root', p: 'cfg1_ab_0' });
});
