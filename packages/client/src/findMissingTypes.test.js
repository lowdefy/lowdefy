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

import findMissingTypes from './findMissingTypes.js';

const types = {
  actions: { Link: () => 'Link' },
  blocks: { Box: () => 'Box', Button: () => 'Button' },
  operators: { _state: () => '_state' },
};

test('findMissingTypes returns nothing when every type is registered', () => {
  expect(
    findMissingTypes({
      pageConfig: {
        type: 'Box',
        blocks: [
          {
            type: 'Button',
            properties: { title: { _state: 'title' } },
            events: { onClick: [{ id: 'link', type: 'Link' }] },
          },
        ],
      },
      types,
    })
  ).toEqual([]);
});

test('findMissingTypes reports a block type the registry does not carry', () => {
  expect(
    findMissingTypes({
      pageConfig: { type: 'Box', blocks: [{ type: 'Card' }] },
      types,
    })
  ).toEqual(['Card']);
});

test('findMissingTypes reports an operator the registry does not carry', () => {
  expect(
    findMissingTypes({
      pageConfig: { type: 'Box', properties: { title: { '_string.concat': ['a', 'b'] } } },
      types,
    })
  ).toEqual(['_string']);
});

test('findMissingTypes reports each missing type once', () => {
  expect(
    findMissingTypes({
      pageConfig: { type: 'Box', blocks: [{ type: 'Card' }, { type: 'Card' }] },
      types,
    })
  ).toEqual(['Card']);
});

test('findMissingTypes ignores a type name in a value position', () => {
  expect(
    findMissingTypes({
      pageConfig: { type: 'Box', properties: { title: 'Card' } },
      types,
    })
  ).toEqual([]);
});
