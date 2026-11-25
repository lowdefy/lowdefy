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

import readPageJsMap from './readPageJsMap.js';
import runTestJourney from './tests/runTestJourney.js';

// A Button that sets state `path` to what the _js function `hash` returns.
function jsButton({ hash, id, path }) {
  return {
    id,
    type: 'Button',
    events: {
      onClick: [{ id: 'set_js', type: 'SetState', params: { [path]: { _js: hash } } }],
    },
  };
}

const loadedJsMap = { h_home: () => 'home js' };

// A page the dev server built after the client map was loaded: its _js is only in its _jsEntries.
const laterPage = {
  id: 'later',
  _jsEntries: "export default { 'h_later': ({ state }) => { return 'later js'; } };",
  blocks: [jsButton({ hash: 'h_later', id: 'later_button', path: 'later' })],
};

const homePage = {
  id: 'home',
  blocks: [
    jsButton({ hash: 'h_home', id: 'home_button', path: 'home' }),
    {
      id: 'to_later',
      type: 'Button',
      events: { onClick: [{ id: 'link', type: 'Link', params: 'later' }] },
    },
  ],
};

test("a page's _jsEntries resolve its _js when the loaded client map lacks them", async () => {
  const { errors, result } = await runTestJourney({
    jsMap: loadedJsMap,
    pages: [homePage, laterPage],
    steps: [
      { click: 'home_button' },
      { expect: { state: { path: 'home', equals: 'home js' } } },
      { click: 'to_later' },
      { click: 'later_button' },
      { expect: { state: { path: 'later', equals: 'later js' } } },
    ],
  });
  expect(errors).toEqual([]);
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

test('a journey opened on a page with _jsEntries resolves its _js', async () => {
  const { errors, result } = await runTestJourney({
    jsMap: loadedJsMap,
    pages: [laterPage],
    steps: [
      { click: 'later_button' },
      { expect: { state: { path: 'later', equals: 'later js' } } },
    ],
  });
  expect(errors).toEqual([]);
  expect(result.passed).toBe(true);
});

test('readPageJsMap returns the loaded map itself for a page with no _jsEntries', () => {
  expect(readPageJsMap({ jsMap: loadedJsMap, pageConfig: {} })).toBe(loadedJsMap);
});

test("readPageJsMap lays a page's entries over the loaded map, keeping the module's flags", () => {
  const jsMap = readPageJsMap({
    jsMap: loadedJsMap,
    pageConfig: {
      _jsEntries:
        "export default { 'h_now': Object.assign(() => { return 1; }, { volatile: true }) };",
    },
  });
  expect(Object.keys(jsMap).sort()).toEqual(['h_home', 'h_now']);
  expect(jsMap.h_home).toBe(loadedJsMap.h_home);
  expect(jsMap.h_now()).toBe(1);
  expect(jsMap.h_now.volatile).toBe(true);
});
