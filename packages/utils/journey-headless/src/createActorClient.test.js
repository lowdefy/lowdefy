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

import createActorClient from './createActorClient.js';

test('createActorClient freezes the block config of the contexts it builds', () => {
  const { appContext, lowdefy } = createActorClient({
    actor: { calls: [], messages: [], user: null },
    host: { call: async () => ({}), errorSink: { add: () => undefined } },
    onBrowserOnly: () => undefined,
    onTrace: () => undefined,
    plugins: {
      actions: {},
      blockMetas: { Box: { category: 'container' } },
      jsMap: {},
      operators: {},
    },
    rootConfig: {
      events: { onInit: [{ id: 'init', type: 'SetState', params: { ready: true } }] },
      home: { configured: false, pageId: 'home' },
      menus: [],
    },
    router: { back: () => undefined, push: () => undefined, replace: () => undefined },
  });

  expect(lowdefy._internal.freezeConfig).toBe(true);
  const appRoot = appContext._internal.RootSlots.slots.root.blocks[0];
  expect(Object.isFrozen(appRoot.events)).toBe(true);
});
