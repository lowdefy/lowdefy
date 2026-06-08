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

import buildOverlay from './buildOverlay.js';
import testContext from '../test-utils/testContext.js';

const overlayBlock = { id: 'dev_tools', type: 'Box' };

test('no overlay config — empty stash', () => {
  const context = testContext();
  const components = {};
  buildOverlay({ components, context });
  expect(context.overlayBlocks).toEqual([]);
  expect(context.overlayExclude).toEqual(new Set());
});

test('overlay blocks are stashed on context', () => {
  const context = testContext();
  const components = { overlay: { blocks: [overlayBlock] } };
  buildOverlay({ components, context });
  expect(context.overlayBlocks).toEqual([overlayBlock]);
});

test('overlay exclude is stashed as a Set of pageIds', () => {
  const context = testContext();
  const components = {
    overlay: { blocks: [overlayBlock], exclude: ['login', '404'] },
  };
  buildOverlay({ components, context });
  expect(context.overlayExclude).toEqual(new Set(['login', '404']));
});

test('devOnly overlay is skipped outside dev stage', () => {
  const context = testContext(); // stage: 'test'
  const components = { overlay: { devOnly: true, blocks: [overlayBlock] } };
  buildOverlay({ components, context });
  expect(context.overlayBlocks).toEqual([]);
});

test('devOnly overlay is applied in dev stage', () => {
  const context = testContext();
  context.stage = 'dev';
  const components = { overlay: { devOnly: true, blocks: [overlayBlock] } };
  buildOverlay({ components, context });
  expect(context.overlayBlocks).toEqual([overlayBlock]);
});

test('overlay must be an object', () => {
  const context = testContext();
  const components = { overlay: [overlayBlock] };
  expect(() => buildOverlay({ components, context })).toThrow(
    'App "overlay" should be an object.'
  );
});

test('overlay.blocks must be an array', () => {
  const context = testContext();
  const components = { overlay: { blocks: { id: 'x' } } };
  expect(() => buildOverlay({ components, context })).toThrow(
    'App "overlay.blocks" should be an array.'
  );
});

test('overlay.exclude must be an array', () => {
  const context = testContext();
  const components = { overlay: { blocks: [overlayBlock], exclude: 'login' } };
  expect(() => buildOverlay({ components, context })).toThrow(
    'App "overlay.exclude" should be an array of pageIds.'
  );
});
