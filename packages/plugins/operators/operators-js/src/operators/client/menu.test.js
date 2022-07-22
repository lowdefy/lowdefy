/*
  Copyright 2020-2022 Lowdefy, Inc

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

/* eslint-disable max-classes-per-file */
import _menu from './menu.js';

const menus = [
  {
    menuId: 'default',
  },
  {
    menuId: 'm_1',
  },
  {
    menuId: 'm_2',
  },
];

test('_media full media object', () => {
  expect(_menu({ params: 'default', menus })).toEqual({
    menuId: 'default',
  });
});

test('_menu using index', () => {
  expect(_menu({ params: 1, menus })).toEqual({
    menuId: 'm_1',
  });
});

test('_menu using index', () => {
  expect(_menu({ params: 1, menus })).toEqual({
    menuId: 'm_1',
  });
});

test('_menu using index', () => {
  expect(_menu({ params: 1, menus })).toEqual({
    menuId: 'm_1',
  });
});

test('_menu using object index', () => {
  expect(_menu({ params: { index: 1 }, menus })).toEqual({
    menuId: 'm_1',
  });
});

test('_menu using object value', () => {
  expect(_menu({ params: { value: 'm_1' }, menus })).toEqual({
    menuId: 'm_1',
  });
});
test('_menu using object all', () => {
  expect(_menu({ params: { all: true }, menus })).toEqual([
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ]);
});

test('_menu full menus', () => {
  expect(_menu({ params: true, menus })).toEqual([
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ]);
});

test('_menu null', () => {
  expect(() => {
    _menu({ params: null, menus });
  }).toThrow('_menu must be of type string, number or object.');
});

test('_menu params object value not string', () => {
  expect(() => {
    _menu({ params: { value: 1 }, menus });
  }).toThrow('_menu.value must be of type string.');
});

test('_menu params object index not number', () => {
  expect(() => {
    _menu({ params: { index: 'a' }, menus });
  }).toThrow('_menu.index must be of type number.');
});

test('_menu using object all and value', () => {
  expect(_menu({ params: { all: true, value: 'default' }, menus })).toEqual([
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ]);
});

test('_menu params object invalid', () => {
  expect(() => {
    _menu({ params: { object: 'a' }, menus });
  }).toThrow('_menu must be of type string, number or object.');
});
