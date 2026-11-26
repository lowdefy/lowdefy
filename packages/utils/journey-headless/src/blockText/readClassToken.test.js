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

import readClassToken, { mayApplyClass } from './readClassToken.js';

test('readClassToken applies Tailwind breakpoints at 1280px', () => {
  expect(readClassToken('hidden')).toEqual({ utility: 'hidden', applies: true });
  expect(readClassToken('md:hidden')).toEqual({ utility: 'hidden', applies: true });
  expect(readClassToken('2xl:hidden')).toEqual({ utility: 'hidden', applies: false });
  expect(readClassToken('max-xl:hidden')).toEqual({ utility: 'hidden', applies: false });
  expect(readClassToken('max-[1199px]:invisible')).toEqual({
    utility: 'invisible',
    applies: false,
  });
  expect(readClassToken('min-[900px]:hidden')).toEqual({ utility: 'hidden', applies: true });
  expect(readClassToken('max-[1300px]:hidden')).toEqual({ utility: 'hidden', applies: true });
});

test('readClassToken cannot tell a variant that is no breakpoint', () => {
  expect(readClassToken('hover:uppercase')).toEqual({ utility: 'uppercase', applies: null });
  expect(readClassToken('dark:md:hidden')).toEqual({ utility: 'hidden', applies: null });
  expect(readClassToken('dark:2xl:hidden')).toEqual({ utility: 'hidden', applies: false });
});

test('mayApplyClass counts a utility that applies or may', () => {
  expect(mayApplyClass({ tokens: ['p-2', 'max-[899px]:hidden'], pattern: /^hidden$/ })).toBe(false);
  expect(mayApplyClass({ tokens: ['group-hover:hidden'], pattern: /^hidden$/ })).toBe(true);
});

test('readClassToken reads an important utility as the utility', () => {
  expect(readClassToken('hidden!')).toEqual({ utility: 'hidden', applies: true });
  expect(readClassToken('md:!uppercase')).toEqual({ utility: 'uppercase', applies: true });
  expect(readClassToken('2xl:hidden!')).toEqual({ utility: 'hidden', applies: false });
});

test('readClassToken keeps the colon of an arbitrary property in its utility', () => {
  expect(readClassToken('[display:none]')).toEqual({ utility: '[display:none]', applies: true });
  expect(readClassToken('2xl:[display:none]')).toEqual({
    utility: '[display:none]',
    applies: false,
  });
  expect(readClassToken('min-[900px]:hidden')).toEqual({ utility: 'hidden', applies: true });
});

test('readClassToken cannot tell a named breakpoint when the app sets its own', () => {
  const options = { customBreakpoints: true };
  expect(readClassToken('md:hidden', options)).toEqual({ utility: 'hidden', applies: null });
  expect(readClassToken('max-md:hidden', options)).toEqual({ utility: 'hidden', applies: null });
  expect(readClassToken('min-[900px]:hidden', options)).toEqual({
    utility: 'hidden',
    applies: true,
  });
  expect(mayApplyClass({ tokens: ['max-xl:hidden'], pattern: /^hidden$/ })).toBe(false);
  expect(
    mayApplyClass({ tokens: ['max-xl:hidden'], pattern: /^hidden$/, customBreakpoints: true })
  ).toBe(true);
});
