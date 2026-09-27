/* eslint-disable dot-notation */

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

import testContext from '../testContext.js';

const lowdefy = { pageId: 'one' };

// The class value comes from state, so the operator's result is exactly the value under test.
async function renderBoxClass({ boxClass, value }) {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [{ id: 'init', type: 'SetState', params: { value } }],
    },
    blocks: [{ id: 'box', type: 'Box', class: boxClass }],
  };
  const context = await testContext({ lowdefy, pageConfig });
  return context._internal.RootSlots.map['box'].eval;
}

test.each([
  ['a string', 'p-4 m-2'],
  ['an array of strings', ['p-4', 'm-2']],
  ['a { className: boolean } object', { 'p-4': true, 'm-2': false }],
])('a root class operator returning %s applies it to the block', async (_, value) => {
  const blockEval = await renderBoxClass({ boxClass: { _state: 'value' }, value });
  expect(blockEval.class).toEqual({ block: value });
  expect(blockEval.parseErrors).toBeNull();
});

test('a root class operator returning a map of CSS keys applies no literal .key class and reports a ConfigError', async () => {
  const blockEval = await renderBoxClass({
    boxClass: { _state: 'value' },
    value: { '.element': 'p-4', 'm-2': true },
  });
  expect(blockEval.class).toEqual({ block: { 'm-2': true } });
  expect(blockEval.parseErrors).toHaveLength(1);
  expect(blockEval.parseErrors[0].name).toBe('ConfigError');
  expect(blockEval.parseErrors[0].message).toBe(
    'Block "box": an operator in class returned a map of CSS keys (".element"). An operator sets the classes of the CSS key it sits under, the block itself at the root of class, so put an operator under each CSS key instead.'
  );
});

test('a CSS key class operator returning a map of CSS keys in an array is reported too', async () => {
  const blockEval = await renderBoxClass({
    boxClass: { '.element': { _state: 'value' } },
    value: ['p-4', { '.header': 'm-2' }],
  });
  expect(blockEval.class).toEqual({ element: ['p-4', {}] });
  expect(blockEval.parseErrors).toHaveLength(1);
});
