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

import isTraceId from './isTraceId.js';

test('isTraceId refuses path traversal, empty strings, uppercase suffixes and non-strings', () => {
  expect(isTraceId('../x')).toBe(false);
  expect(isTraceId('')).toBe(false);
  expect(isTraceId('20261003T140311Z-K3X9QA')).toBe(false);
  expect(isTraceId('20261003T140311Z-k3x9qa/../../x')).toBe(false);
  expect(isTraceId(null)).toBe(false);
  expect(isTraceId(20261003)).toBe(false);
  expect(isTraceId('20261003T140311Z-k3x9qa')).toBe(true);
});
