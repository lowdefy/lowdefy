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

import { jest } from '@jest/globals';

import classStyle from './classStyle.js';

const classMap = {
  'p-1': { padding: 1 },
  'p-2': { padding: 2 },
  'sm:p-3': { padding: 3 },
  'lg:p-4': { padding: 4 },
  'dark:p-5': { padding: 5 },
  'dark:md:p-6': { padding: 6 },
  'hover:p-7': { padding: 7 },
  'bg-primary': { backgroundColor: 'light' },
  'dark:bg-primary': { backgroundColor: 'dark' },
};

function style({ breakpoint = 'xs', classValue, isDark = false, onMissing = () => undefined }) {
  return classStyle({ breakpoint, classMap, classValue, isDark, onMissing });
}

test('classStyle applies later classes of the same rank over earlier ones', () => {
  expect(style({ classValue: 'p-2 p-1' })).toEqual({ padding: 1 });
});

test('classStyle applies breakpoint classes from their breakpoint up, in breakpoint order', () => {
  expect(style({ classValue: 'lg:p-4 sm:p-3 p-1' })).toEqual({ padding: 1 });
  expect(style({ breakpoint: 'md', classValue: 'lg:p-4 sm:p-3 p-1' })).toEqual({ padding: 3 });
  expect(style({ breakpoint: 'xl', classValue: 'lg:p-4 sm:p-3 p-1' })).toEqual({ padding: 4 });
});

test('classStyle applies dark classes in dark mode, after breakpoint classes', () => {
  expect(style({ breakpoint: 'lg', classValue: 'dark:p-5 lg:p-4' })).toEqual({ padding: 4 });
  expect(style({ breakpoint: 'lg', classValue: 'dark:p-5 lg:p-4', isDark: true })).toEqual({
    padding: 5,
  });
  expect(style({ breakpoint: 'md', classValue: 'dark:md:p-6 dark:p-5', isDark: true })).toEqual({
    padding: 6,
  });
  expect(style({ breakpoint: 'sm', classValue: 'dark:md:p-6 dark:p-5', isDark: true })).toEqual({
    padding: 5,
  });
});

test('classStyle reads the dark entry of an antd colour class in dark mode', () => {
  expect(style({ classValue: 'bg-primary' })).toEqual({ backgroundColor: 'light' });
  expect(style({ classValue: 'bg-primary', isDark: true })).toEqual({ backgroundColor: 'dark' });
});

test('classStyle never applies a variant it has no state for', () => {
  expect(style({ classValue: 'p-1 hover:p-7' })).toEqual({ padding: 1 });
});

test('classStyle reads class arrays and objects as the web cn does', () => {
  expect(style({ classValue: ['p-1', { 'p-2': true, 'sm:p-3': false }] })).toEqual({
    padding: 2,
  });
  expect(style({ classValue: null })).toEqual({});
});

test('classStyle reports each class the map does not hold', () => {
  const onMissing = jest.fn();
  expect(style({ classValue: 'p-1 made-up dark:made-up', onMissing })).toEqual({ padding: 1 });
  expect(onMissing.mock.calls).toEqual([['made-up'], ['dark:made-up']]);
});
