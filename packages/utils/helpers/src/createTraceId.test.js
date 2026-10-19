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

import createTraceId from './createTraceId.js';
import isTraceId from './isTraceId.js';
import traceIdDate from './traceIdDate.js';

test('createTraceId formats the UTC time and a six character base36 suffix', () => {
  const id = createTraceId({ now: Date.parse('2026-10-03T14:03:11.250Z') });
  expect(id).toMatch(/^20261003T140311Z-[a-z0-9]{6}$/);
});

test('createTraceId round-trips through isTraceId and traceIdDate', () => {
  const id = createTraceId({ now: new Date('2026-01-09T23:59:59Z') });
  expect(isTraceId(id)).toBe(true);
  expect(traceIdDate(id)).toBe('2026-01-09');
});

test('createTraceId defaults to the current time', () => {
  const id = createTraceId();
  expect(isTraceId(id)).toBe(true);
});
