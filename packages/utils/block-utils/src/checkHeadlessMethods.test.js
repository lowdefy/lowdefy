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

import checkHeadlessMethods from './checkHeadlessMethods.js';

test('checkHeadlessMethods accepts an event name and null for a no-op', () => {
  expect(() =>
    checkHeadlessMethods({
      blockType: 'app_Timeline',
      headlessMethods: { run: 'onRun', merge: null },
    })
  ).not.toThrow();
});

test('checkHeadlessMethods accepts a meta that declares none', () => {
  expect(() =>
    checkHeadlessMethods({ blockType: 'app_Timeline', headlessMethods: undefined })
  ).not.toThrow();
  expect(() =>
    checkHeadlessMethods({ blockType: 'app_Timeline', headlessMethods: null })
  ).not.toThrow();
});

test.each([
  [{ fires: 'onRun' }, '{"fires":"onRun"}'],
  ['', '""'],
  [false, 'false'],
  [0, '0'],
  [['onRun'], '["onRun"]'],
  [undefined, 'undefined'],
])(
  'checkHeadlessMethods refuses a method declared as %j, naming the block type and the method',
  (value, shown) => {
    expect(() =>
      checkHeadlessMethods({
        blockType: 'app_Timeline',
        headlessMethods: { run: 'onRun', merge: value },
      })
    ).toThrow(
      `Block type app_Timeline declares headlessMethods.merge as ${shown}: it should be the name of the block event the method fires, or null for a method that changes only what the block draws.`
    );
  }
);

test('checkHeadlessMethods refuses headlessMethods that is not an object', () => {
  expect(() =>
    checkHeadlessMethods({ blockType: 'app_Timeline', headlessMethods: ['merge'] })
  ).toThrow(
    'Block type app_Timeline declares headlessMethods as ["merge"]: it should be an object of { [method]: the name of the event it fires, or null }.'
  );
  expect(() =>
    checkHeadlessMethods({ blockType: 'app_Timeline', headlessMethods: 'merge' })
  ).toThrow(
    'Block type app_Timeline declares headlessMethods as "merge": it should be an object of { [method]: the name of the event it fires, or null }.'
  );
});
