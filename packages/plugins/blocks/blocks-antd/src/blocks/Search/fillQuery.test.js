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
import { describe, expect, test } from 'vitest';

import fillQuery from './fillQuery.js';

describe('fillQuery', () => {
  test('replaces {query} at any depth', () => {
    expect(fillQuery({ q: 'a {query}', list: ['{query}', 1] }, 'x')).toEqual({
      q: 'a x',
      list: ['x', 1],
    });
  });

  test('keeps replacement patterns in the typed query literal', () => {
    expect(fillQuery('Ask: {query}', "cost $& $$ $` $'")).toBe("Ask: cost $& $$ $` $'");
  });
});
