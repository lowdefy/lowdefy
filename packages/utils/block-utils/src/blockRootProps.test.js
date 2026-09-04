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

import blockRootProps from './blockRootProps.js';

test('blockRootProps renders the blockId as both id and data-testid', () => {
  expect(blockRootProps({ blockId: 'my_block' })).toEqual({
    id: 'my_block',
    'data-testid': 'my_block',
    className: '',
    style: {},
  });
});

test('blockRootProps merges the block and element class slots', () => {
  expect(
    blockRootProps({
      blockId: 'my_block',
      classNames: { block: 'border', element: 'text-sm' },
    }).className
  ).toEqual('border text-sm');
});

test('blockRootProps merges the block and element style slots, element winning', () => {
  expect(
    blockRootProps({
      blockId: 'my_block',
      styles: { block: { color: 'red', margin: 1 }, element: { color: 'blue' } },
    }).style
  ).toEqual({ color: 'blue', margin: 1 });
});

test('blockRootProps puts block owned defaults first so the app author overrides them', () => {
  const rootProps = blockRootProps({
    blockId: 'my_block',
    classNames: { element: 'p-4' },
    styles: { element: { color: 'blue' } },
    className: 'p-1 flex',
    style: { color: 'red', cursor: 'pointer' },
  });
  expect(rootProps.className).toEqual('flex p-4');
  expect(rootProps.style).toEqual({ color: 'blue', cursor: 'pointer' });
});

test('blockRootProps tolerates a missing classNames or styles slot', () => {
  expect(blockRootProps({ blockId: 'my_block', classNames: {}, styles: {} })).toEqual({
    id: 'my_block',
    'data-testid': 'my_block',
    className: '',
    style: {},
  });
  expect(blockRootProps({ blockId: 'my_block', classNames: { block: 'a' } }).className).toEqual(
    'a'
  );
  expect(blockRootProps({ blockId: 'my_block', styles: { block: { top: 0 } } }).style).toEqual({
    top: 0,
  });
});

test('blockRootProps returns the same shape when called with no arguments', () => {
  expect(blockRootProps()).toEqual({
    id: undefined,
    'data-testid': undefined,
    className: '',
    style: {},
  });
});
