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
import parseStages from './parseStages.js';

test('parseStages defaults to dev and prod', () => {
  expect(parseStages({ stages: undefined })).toEqual(['dev', 'prod']);
  expect(parseStages({ stages: '' })).toEqual(['dev', 'prod']);
});

test('parseStages splits, trims and de-duplicates', () => {
  expect(parseStages({ stages: ' dev, sandbox ,prod,dev' })).toEqual(['dev', 'sandbox', 'prod']);
});

test('parseStages rejects the reserved local stage', () => {
  expect(() => parseStages({ stages: 'local,prod' })).toThrow('reserved');
});

test('parseStages rejects an unsafe stage name', () => {
  expect(() => parseStages({ stages: 'pr od' })).toThrow('not a valid stage name');
});
