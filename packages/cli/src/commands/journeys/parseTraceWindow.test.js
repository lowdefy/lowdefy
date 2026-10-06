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

import parseTraceWindow from './parseTraceWindow.js';

const now = Date.parse('2026-10-03T15:00:00.000Z');

test('parseTraceWindow defaults to the 30 days ending today', () => {
  expect(parseTraceWindow({ now })).toEqual({ from: '2026-09-04', to: '2026-10-03' });
});

test('parseTraceWindow reads --since in days as the days ending today', () => {
  expect(parseTraceWindow({ since: '3d', now })).toEqual({ from: '2026-10-01', to: '2026-10-03' });
  expect(parseTraceWindow({ since: '1d', now })).toEqual({ from: '2026-10-03', to: '2026-10-03' });
});

test('parseTraceWindow starts a --since date on its UTC day', () => {
  expect(parseTraceWindow({ since: '2026-09-20', now })).toEqual({
    from: '2026-09-20',
    to: '2026-10-03',
  });
});

test('parseTraceWindow takes an explicit --from and --to', () => {
  expect(parseTraceWindow({ from: '2026-09-01', to: '2026-09-30', now })).toEqual({
    from: '2026-09-01',
    to: '2026-09-30',
  });
});

test('parseTraceWindow refuses --since with --from', () => {
  expect(() =>
    parseTraceWindow({ since: '3d', from: '2026-09-01', to: '2026-09-02', now })
  ).toThrow('pass one or the other');
});

test('parseTraceWindow refuses --from without --to', () => {
  expect(() => parseTraceWindow({ from: '2026-09-01', now })).toThrow(
    '--from and --to go together'
  );
  expect(() => parseTraceWindow({ to: '2026-09-01', now })).toThrow('--from and --to go together');
});

test('parseTraceWindow refuses a day that is not a date', () => {
  expect(() => parseTraceWindow({ from: '2026-02-30', to: '2026-03-01', now })).toThrow(
    '--from takes a UTC date as YYYY-MM-DD'
  );
});

test('parseTraceWindow refuses --from after --to', () => {
  expect(() => parseTraceWindow({ from: '2026-09-05', to: '2026-09-01', now })).toThrow(
    '--from should not be after --to'
  );
});

test('parseTraceWindow refuses a window longer than maxDays with one message', () => {
  expect(() => parseTraceWindow({ since: '31d', now, maxDays: 30 })).toThrow(
    'The window 2026-09-03/2026-10-03 is 31 days long; a mining window is at most 30 days. Pick a shorter window with --since or --from and --to.'
  );
  expect(() =>
    parseTraceWindow({ from: '2026-09-01', to: '2026-10-01', now, maxDays: 30 })
  ).toThrow(
    'The window 2026-09-01/2026-10-01 is 31 days long; a mining window is at most 30 days.'
  );
  expect(() => parseTraceWindow({ since: '2026-08-01', now, maxDays: 30 })).toThrow(
    'a mining window is at most 30 days'
  );
});

test('parseTraceWindow takes a window of exactly maxDays', () => {
  expect(parseTraceWindow({ now, maxDays: 30 })).toEqual({ from: '2026-09-04', to: '2026-10-03' });
  expect(parseTraceWindow({ since: '30d', now, maxDays: 30 })).toEqual({
    from: '2026-09-04',
    to: '2026-10-03',
  });
  expect(parseTraceWindow({ from: '2026-09-01', to: '2026-09-30', now, maxDays: 30 })).toEqual({
    from: '2026-09-01',
    to: '2026-09-30',
  });
});

test('parseTraceWindow does not cap a window without maxDays', () => {
  expect(parseTraceWindow({ since: '90d', now })).toEqual({ from: '2026-07-06', to: '2026-10-03' });
});
