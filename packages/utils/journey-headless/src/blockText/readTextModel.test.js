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

import registerHeadlessMethods from '../standIns/registerHeadlessMethods.js';
import readTextModel from './readTextModel.js';

const blockMetas = {
  PluginTimeline: {
    category: 'display',
    headlessText: ['title'],
    headlessMethods: { merge: null },
  },
};

function createBlock() {
  const methods = {};
  return {
    block: {
      blockId: 'timeline',
      type: 'PluginTimeline',
      registerMethod: (method, fn) => {
        methods[method] = fn;
      },
    },
    methods,
  };
}

test("readTextModel reads a plugin block's declared text until a method declared null redraws it", () => {
  const { block, methods } = createBlock();
  registerHeadlessMethods({ block, headlessMethods: blockMetas.PluginTimeline.headlessMethods });
  const properties = { title: 'Events' };
  expect(readTextModel({ block, blockMetas })({ block, properties })).toEqual({
    pieces: [{ text: 'Events' }],
    areas: null,
    open: null,
  });
  methods.merge({ rows: [1] });
  expect(readTextModel({ block, blockMetas })({ block, properties })).toEqual({
    pieces: [],
    areas: null,
    open: 'its method "merge" changed what it draws, which a headless run does not follow',
  });
});
