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

import parseWmiStartTime from './parseWmiStartTime.js';

test('parseWmiStartTime converts a CIM_DATETIME with its own UTC offset to epoch milliseconds', () => {
  expect(parseWmiStartTime('20261002225531.123456+120')).toEqual(
    Date.UTC(2026, 9, 2, 20, 55, 31, 123)
  );
  expect(parseWmiStartTime('20261002155531.123999-300\r\n')).toEqual(
    Date.UTC(2026, 9, 2, 20, 55, 31, 123)
  );
  expect(parseWmiStartTime('20261002205531.000000+000')).toEqual(Date.UTC(2026, 9, 2, 20, 55, 31));
});

test('parseWmiStartTime reads one process the same across a time zone or daylight saving change', () => {
  // One instant as WMI prints it in South Africa, in Tokyo, and in New York before and after
  // the end of daylight saving.
  const instant = Date.UTC(2026, 10, 1, 5, 30, 0);
  [
    '20261101073000.000000+120',
    '20261101143000.000000+540',
    '20261101013000.000000-240',
    '20261101003000.000000-300',
  ].forEach((text) => {
    expect(parseWmiStartTime(text)).toEqual(instant);
  });
});

test('parseWmiStartTime tells apart the two instants of the repeated fall-back hour', () => {
  // 01:30 happens twice in New York on 1 November 2026: first in EDT, then in EST.
  const first = parseWmiStartTime('20261101013000.000000-240');
  const second = parseWmiStartTime('20261101013000.000000-300');
  expect(second - first).toEqual(60 * 60 * 1000);
});

test('parseWmiStartTime returns null for text that is not a CIM_DATETIME', () => {
  ['', '2026100222', '2026-10-02T20:55:31.0000000Z', '20261002225531.123456'].forEach((text) => {
    expect(parseWmiStartTime(text)).toBeNull();
  });
});
