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

import deriveAreaStyle from './deriveAreaStyle.js';

test('empty area returns empty style', () => {
  expect(deriveAreaStyle({})).toEqual({});
});

test('gap undefined returns empty style', () => {
  expect(deriveAreaStyle({ gap: undefined })).toEqual({});
});

test('gap null returns empty style', () => {
  expect(deriveAreaStyle({ gap: null })).toEqual({});
});

test('gap is a number sets both axes', () => {
  expect(deriveAreaStyle({ gap: 16 })).toEqual({
    '--lf-gap-x': '16px',
    '--lf-gap-y': '16px',
  });
});

test('gap is 0 sets both axes to 0px', () => {
  expect(deriveAreaStyle({ gap: 0 })).toEqual({
    '--lf-gap-x': '0px',
    '--lf-gap-y': '0px',
  });
});

test('gap is a float rounds to nearest integer', () => {
  expect(deriveAreaStyle({ gap: 16.7 })).toEqual({
    '--lf-gap-x': '17px',
    '--lf-gap-y': '17px',
  });
});

test('gap is an array sets x and y independently', () => {
  expect(deriveAreaStyle({ gap: [20, 10] })).toEqual({
    '--lf-gap-x': '20px',
    '--lf-gap-y': '10px',
  });
});

test('gap is an array with responsive x and simple y', () => {
  expect(deriveAreaStyle({ gap: [{ sm: 10, md: 20 }, 8] })).toEqual({
    '--lf-gap-x-sm': '10px',
    '--lf-gap-x-md': '20px',
    '--lf-gap-y': '8px',
  });
});

test('gap is an object sets breakpoint vars for both axes', () => {
  expect(deriveAreaStyle({ gap: { sm: 15, md: 30 } })).toEqual({
    '--lf-gap-x-sm': '15px',
    '--lf-gap-x-md': '30px',
    '--lf-gap-y-sm': '15px',
    '--lf-gap-y-md': '30px',
  });
});

test('gap is an object with xs sets base vars for both axes', () => {
  expect(deriveAreaStyle({ gap: { xs: 10, sm: 20 } })).toEqual({
    '--lf-gap-x': '10px',
    '--lf-gap-x-sm': '20px',
    '--lf-gap-y': '10px',
    '--lf-gap-y-sm': '20px',
  });
});
