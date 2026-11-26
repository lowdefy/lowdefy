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

import createJitMaps from '../build/jit/createJitMaps.js';
import logMapId from './logMapId.js';

test('logMapId logs ids added to the maps a JIT context logs, in insertion order', () => {
  const keyMap = { config_key: {} };
  const refMap = {};
  const jitMaps = createJitMaps({ keyMap, refMap, name: 'jit' });

  logMapId({ map: keyMap, id: 'b' });
  logMapId({ map: keyMap, id: 'a' });
  logMapId({ map: refMap, id: 'r' });

  expect(jitMaps.keys.added).toEqual(['b', 'a']);
  expect(jitMaps.refs.added).toEqual(['r']);
});

test('logMapId logs nothing for a map with no log, such as a copy of a logged map', () => {
  const refMap = {};
  const jitMaps = createJitMaps({ keyMap: {}, refMap, name: 'jit' });

  logMapId({ map: { ...refMap }, id: 'copied' });
  logMapId({ map: {}, id: 'config' });

  expect(jitMaps.refs.added).toEqual([]);
});
