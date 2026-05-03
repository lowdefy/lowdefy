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

import { SEVERITY_LEVELS, meetsThreshold } from './severityLevels.js';

test('SEVERITY_LEVELS values are ordered low < medium < high', () => {
  expect(SEVERITY_LEVELS.low).toBeLessThan(SEVERITY_LEVELS.medium);
  expect(SEVERITY_LEVELS.medium).toBeLessThan(SEVERITY_LEVELS.high);
});

test('meetsThreshold returns true when event severity equals threshold', () => {
  expect(meetsThreshold('medium', 'medium')).toBe(true);
});

test('meetsThreshold returns true when event severity exceeds threshold', () => {
  expect(meetsThreshold('high', 'medium')).toBe(true);
  expect(meetsThreshold('high', 'low')).toBe(true);
  expect(meetsThreshold('medium', 'low')).toBe(true);
});

test('meetsThreshold returns false when event severity is below threshold', () => {
  expect(meetsThreshold('low', 'medium')).toBe(false);
  expect(meetsThreshold('low', 'high')).toBe(false);
  expect(meetsThreshold('medium', 'high')).toBe(false);
});

test('meetsThreshold defaults unknown severities to medium', () => {
  expect(meetsThreshold('unknown', 'medium')).toBe(true);
  expect(meetsThreshold('medium', 'unknown')).toBe(true);
});
