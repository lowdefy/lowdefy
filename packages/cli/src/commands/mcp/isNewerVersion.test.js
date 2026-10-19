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

import isNewerVersion from './isNewerVersion.js';

const EXPERIMENTAL = '0.0.0-experimental-20261002122353';
const LATER_EXPERIMENTAL = '0.0.0-experimental-20261003000000';

test.each([
  ['7.1.0', '7.0.0', true],
  ['6.1.0', '7.0.0', false],
  ['8.0.0', '7.0.0', true],
  ['7.0.0', '7.0.0', false],
  ['7.0.0', '7.0.0-rc.1', true],
  ['7.0.0-rc.1', '7.0.0', false],
  ['7.0.0-rc.2', '7.0.0-rc.1', true],
  ['1.0.0', EXPERIMENTAL, false],
  ['6.1.0', EXPERIMENTAL, false],
  [EXPERIMENTAL, '7.0.0', false],
  [LATER_EXPERIMENTAL, EXPERIMENTAL, true],
  [EXPERIMENTAL, LATER_EXPERIMENTAL, false],
  ['8.0.0-rc.1', '7.0.0', false],
])('isNewerVersion %s over %s is %s', (candidate, held, expected) => {
  expect(isNewerVersion({ candidate, held })).toBe(expected);
});
