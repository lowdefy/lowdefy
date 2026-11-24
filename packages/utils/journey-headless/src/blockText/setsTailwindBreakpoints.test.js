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

import setsTailwindBreakpoints from './setsTailwindBreakpoints.js';

test('setsTailwindBreakpoints finds a breakpoint theme variable, nested or joined', () => {
  expect(setsTailwindBreakpoints({ tailwind: { breakpoint: { md: '50rem' } } })).toBe(true);
  expect(setsTailwindBreakpoints({ tailwind: { 'breakpoint-3xl': '120rem' } })).toBe(true);
  expect(setsTailwindBreakpoints({ tailwind: { color: { brand: '#f00' } } })).toBe(false);
  expect(setsTailwindBreakpoints({ tailwind: undefined })).toBe(false);
});
