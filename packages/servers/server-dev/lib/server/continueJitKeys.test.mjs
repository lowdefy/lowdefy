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

import { makeId } from '@lowdefy/build/dev';

import continueJitKeys from './continueJitKeys.js';

test('two dev server processes serving one config build never hand out the same key', () => {
  const idCounter = { prefix: 'a1b2_', counter: 40 };

  continueJitKeys({ idCounter, childId: 'aaaaaa' });
  const first = [makeId.next(), makeId.next()];
  continueJitKeys({ idCounter, childId: 'bbbbbb' });
  const second = [makeId.next(), makeId.next()];

  expect(first).toEqual(['a1b2_aaaaaa_1', 'a1b2_aaaaaa_2']);
  expect(second).toEqual(['a1b2_bbbbbb_1', 'a1b2_bbbbbb_2']);
});

test('a recreated build context in the same process continues its keys', () => {
  const idCounter = { prefix: 'c3d4_', counter: 40 };

  continueJitKeys({ idCounter, childId: 'aaaaaa' });
  const first = makeId.next();
  continueJitKeys({ idCounter, childId: 'aaaaaa' });
  const second = makeId.next();

  expect(first).toBe('c3d4_aaaaaa_1');
  expect(second).toBe('c3d4_aaaaaa_2');
});
