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

import getBreakpoint from './getBreakpoint.js';

test('getBreakpoint uses the shorter side on a phone, so landscape keeps the portrait layout', () => {
  expect(getBreakpoint({ width: 390, height: 844 })).toBe('xs');
  expect(getBreakpoint({ width: 844, height: 390 })).toBe('xs');
  expect(getBreakpoint({ width: 932, height: 430 })).toBe('xs');
});

test('getBreakpoint uses the width on a tablet, with v7 thresholds 640, 768 and 1024', () => {
  expect(getBreakpoint({ width: 744, height: 1133 })).toBe('sm');
  expect(getBreakpoint({ width: 768, height: 1024 })).toBe('md');
  expect(getBreakpoint({ width: 1024, height: 768 })).toBe('lg');
  expect(getBreakpoint({ width: 1366, height: 1024 })).toBe('xl');
  expect(getBreakpoint({ width: 1600, height: 1000 })).toBe('2xl');
  expect(getBreakpoint({ width: 639, height: 800 })).toBe('xs');
  expect(getBreakpoint({ width: 640, height: 800 })).toBe('sm');
});
