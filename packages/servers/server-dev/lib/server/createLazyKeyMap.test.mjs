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

// Page build keys carry the dev server process's id: <prefix><childId>_<counter>.
const isPageBuildKey = (id) => id.includes('_ab_');

const skeleton = {
  cfg1_1: { s: 'root', p: 'cfg1_0', r: 'ref-root' },
  cfg1_2: { s: '.pages', p: 'cfg1_1' },
};

test('a lazy key map reads the config build key map only when a lookup misses an added entry', () => {
  const readSkeletonKeyMap = vi.fn(() => skeleton);
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap,
    isPageBuildKey,
    onConfigBuildEntryRead: () => {},
  });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0', r: 'ref-page' };

  expect(keyMap.get('cfg1_ab_1')).toEqual({ s: 'root', p: 'cfg1_ab_0', r: 'ref-page' });
  expect(readSkeletonKeyMap).not.toHaveBeenCalled();

  expect(keyMap.get('cfg1_2')).toEqual({ s: '.pages', p: 'cfg1_1' });
  expect(keyMap.get('missing')).toBeUndefined();
  expect(readSkeletonKeyMap).toHaveBeenCalledTimes(1);
});

test('a lazy key map lists only the entries added to it', () => {
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap: () => skeleton,
    isPageBuildKey,
    onConfigBuildEntryRead: () => {},
  });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0' };
  keyMap.get('cfg1_1');

  expect(Object.keys(keyMap)).toEqual(['cfg1_ab_1']);
});

test('the key map readers resolve a chain from an added entry into the config build entries', () => {
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap: () => skeleton,
    isPageBuildKey,
    onConfigBuildEntryRead: () => {},
  });
  keyMap['cfg1_ab_1'] = { s: '[0:home:Box]', p: 'cfg1_2' };

  expect(resolveKeyEntry({ keyMap, configKey: 'cfg1_ab_1' })).toMatchObject({
    path: 'root.pages[0:home:Box]',
    refId: 'ref-root',
  });
});

test('a lazy key map with no keyMap.json resolves only the added entries', () => {
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap: () => null,
    isPageBuildKey,
    onConfigBuildEntryRead: () => {},
  });
  keyMap['cfg1_ab_1'] = { s: 'root', p: 'cfg1_ab_0' };

  expect(keyMap.get('cfg1_1')).toBeUndefined();
  expect(keyMap.get('cfg1_ab_1')).toEqual({ s: 'root', p: 'cfg1_ab_0' });
});

test('a lookup of a page build key never reads the config build key map', () => {
  const readSkeletonKeyMap = vi.fn(() => skeleton);
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap,
    isPageBuildKey,
    onConfigBuildEntryRead: () => {},
  });
  keyMap['cfg1_ab_2'] = { s: '.title', p: 'cfg1_ab_1' };

  // A warning's walk up to the root's parent, an id addKeys never writes.
  expect(resolveKeyEntry({ keyMap, configKey: 'cfg1_ab_2' })).toMatchObject({ path: '.title' });
  expect(readSkeletonKeyMap).not.toHaveBeenCalled();
});

test('a lookup that returns a config build entry is reported, a miss is not', () => {
  const onConfigBuildEntryRead = vi.fn();
  const keyMap = createLazyKeyMap({
    readSkeletonKeyMap: () => skeleton,
    isPageBuildKey,
    onConfigBuildEntryRead,
  });

  keyMap.get('missing');
  expect(onConfigBuildEntryRead).not.toHaveBeenCalled();
  keyMap.get('cfg1_2');
  expect(onConfigBuildEntryRead).toHaveBeenCalledTimes(1);
});
