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

import parseTier from './parseTier.js';

test('parseTier defaults to full and accepts every tier', () => {
  expect(parseTier()).toBe('full');
  ['common', 'wide', 'edge', 'full'].forEach((tier) => expect(parseTier(tier)).toBe(tier));
});

test('parseTier refuses an unknown tier with the received value', () => {
  expect(() => parseTier('popular')).toThrow(
    '--tier should be one of common, wide, edge, full. Received "popular".'
  );
});
