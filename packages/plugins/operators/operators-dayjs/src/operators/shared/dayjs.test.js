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

import _dayjs from './dayjs.js';

describe('_dayjs.format', () => {
  const methodName = 'format';

  test('No options', () => {
    expect(
      _dayjs({
        params: {
          on: new Date(1560414023345),
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('2019-06-13T08:20:23+00:00');
  });

  test('locale ar', () => {
    expect(
      _dayjs({
        params: {
          on: new Date(1560414023345),
          locale: 'ar',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('2019-06-13T08:20:23+00:00');
  });

  test('locale fr', () => {
    expect(
      _dayjs({
        params: {
          on: new Date(1560414023345),
          locale: 'fr',
          format: 'D MMMM YYYY',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('13 juin 2019');
  });

  test('specify format', () => {
    expect(
      _dayjs({
        params: {
          on: new Date(1560414023345),
          format: 'd MMM YYYY',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('4 Jun 2019');
  });
});

describe('_dayjs.humanizeDuration', () => {
  const methodName = 'humanizeDuration';

  test('No options', () => {
    expect(
      _dayjs({
        params: {
          on: 245923000,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('3 days');
  });

  test('locale ar', () => {
    expect(
      _dayjs({
        params: {
          on: 245923000,
          locale: 'ar',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('3 أيام');
  });

  test('withSuffix', () => {
    expect(
      _dayjs({
        params: {
          on: 245923000,
          withSuffix: true,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('in 3 days');
    expect(
      _dayjs({
        params: {
          on: -245923000,
          withSuffix: true,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('3 days ago');
  });

  test('thresholds param is accepted but ignored by dayjs', () => {
    expect(
      _dayjs({
        params: {
          on: 604800000,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('7 days');
    // With thresholds param — dayjs ignores it, so result is the same
    expect(
      _dayjs({
        params: {
          on: 604800000,
          thresholds: { d: 7, w: 4 },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('7 days');
  });
});

describe('_dayjs chain mode', () => {
  test('chain with "now" and format', () => {
    const result = _dayjs({
      params: ['now', { format: 'YYYY' }],
      location: 'locationId',
    });
    expect(result).toEqual(new Date().getFullYear().toString());
  });

  test('chain with date input and format', () => {
    const result = _dayjs({
      params: ['2019-06-13T08:20:23.345Z', { format: 'YYYY-MM-DD' }],
      location: 'locationId',
    });
    expect(result).toEqual('2019-06-13');
  });

  test('chain subtract and format', () => {
    const result = _dayjs({
      params: ['2024-03-15T00:00:00.000Z', { subtract: [3, 'days'] }, { format: 'YYYY-MM-DD' }],
      location: 'locationId',
    });
    expect(result).toEqual('2024-03-12');
  });

  test('chain add and format', () => {
    const result = _dayjs({
      params: ['2024-01-01T00:00:00.000Z', { add: [1, 'month'] }, { format: 'YYYY-MM-DD' }],
      location: 'locationId',
    });
    expect(result).toEqual('2024-02-01');
  });

  test('chain fromNow returns relative string', () => {
    const result = _dayjs({
      params: ['2000-01-01T00:00:00.000Z', 'fromNow'],
      location: 'locationId',
    });
    expect(typeof result).toBe('string');
    expect(result).toContain('years ago');
  });

  test('chain startOf and format', () => {
    const result = _dayjs({
      params: ['2024-03-15T14:30:00.000Z', { startOf: 'month' }, { format: 'YYYY-MM-DD' }],
      location: 'locationId',
    });
    expect(result).toEqual('2024-03-01');
  });

  test('chain with single element returns ISO string', () => {
    const result = _dayjs({
      params: ['2024-01-01T00:00:00.000Z'],
      location: 'locationId',
    });
    expect(result).toEqual('2024-01-01T00:00:00.000Z');
  });

  test('chain diff returns a number', () => {
    const result = _dayjs({
      params: ['2024-03-15T00:00:00.000Z', { diff: ['2024-03-10T00:00:00.000Z', 'days'] }],
      location: 'locationId',
    });
    expect(result).toEqual(5);
  });

  test('chain isBefore returns boolean', () => {
    const result = _dayjs({
      params: ['2024-01-01T00:00:00.000Z', { isBefore: '2024-06-01T00:00:00.000Z' }],
      location: 'locationId',
    });
    expect(result).toBe(true);
  });

  test('chain throws on disallowed method', () => {
    expect(() =>
      _dayjs({
        params: ['now', 'constructor'],
        location: 'locationId',
      })
    ).toThrow('_dayjs chain method "constructor" is not supported');
  });

  test('chain with now, subtract, fromNow (user scenario)', () => {
    const result = _dayjs({
      params: ['now', { subtract: [3, 'days'] }, 'fromNow'],
      location: 'locationId',
    });
    expect(result).toEqual('3 days ago');
  });
});
