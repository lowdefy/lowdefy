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

import breakpointIndex from './breakpointIndex.js';

test('breakpointIndex orders breakpoints smallest first', () => {
  expect(['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map(breakpointIndex)).toEqual([0, 1, 2, 3, 4, 5]);
});

test('breakpointIndex throws on an unknown breakpoint', () => {
  expect(() => breakpointIndex('xxl')).toThrow('Unknown layout breakpoint. Received "xxl".');
});
