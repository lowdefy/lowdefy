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

import hasOptionDescriptions from './hasOptionDescriptions.js';

test('hasOptionDescriptions is true when at least one option has a description', () => {
  const described = [
    { value: 'lead', description: 'Not yet spoken to.' },
    { value: 'won', description: undefined },
  ];
  const plain = [{ value: 'won', description: undefined }];
  expect(hasOptionDescriptions({ options: described })).toBe(true);
  expect(hasOptionDescriptions({ options: plain })).toBe(false);
  expect(hasOptionDescriptions({ options: [] })).toBe(false);
});
