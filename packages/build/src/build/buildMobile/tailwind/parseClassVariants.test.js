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
import parseClassVariants from './parseClassVariants.js';

test('parseClassVariants splits variants from the utility outside brackets', () => {
  expect(parseClassVariants('p-4')).toEqual({ variants: [], utility: 'p-4' });
  expect(parseClassVariants('dark:sm:bg-gray-900')).toEqual({
    variants: ['dark', 'sm'],
    utility: 'bg-gray-900',
  });
  expect(parseClassVariants('bg-[url(a:b)]')).toEqual({ variants: [], utility: 'bg-[url(a:b)]' });
});
