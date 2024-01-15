/*
  Copyright 2020-2024 Lowdefy, Inc

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
import intl from './intl.js';

describe('_intl.dateTimeFormat', () => {
  const methodName = 'dateTimeFormat';
  test('No options', () => {
    expect(
      intl({
        params: {
          on: new Date(1560414023345),
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('6/13/2019');
  });
  test('Set locale', () => {
    expect(
      intl({
        params: {
          on: new Date(1560414023345),
          locale: 'de',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('13.6.2019');
  });
  test('Set options', () => {
    expect(
      intl({
        params: {
          on: new Date(1560414023345),
          options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Thursday, June 13, 2019');
  });
});

describe('_intl.listFormat', () => {
  const methodName = 'listFormat';
  test('No options', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle, Bus, and Car');
  });
  test('Set locale', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
          locale: 'fr',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle, Bus et Car');
  });
  test('Set options', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
          options: { style: 'narrow', type: 'unit' },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle Bus Car');
  });
});

describe('_intl.listFormat', () => {
  const methodName = 'listFormat';
  test('No options', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle, Bus, and Car');
  });
  test('Set locale', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
          locale: 'fr',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle, Bus et Car');
  });
  test('Set options', () => {
    expect(
      intl({
        params: {
          on: ['Motorcycle', 'Bus', 'Car'],
          options: { style: 'narrow', type: 'unit' },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('Motorcycle Bus Car');
  });
});

describe('_intl.numberFormat', () => {
  const methodName = 'numberFormat';
  test('No options', () => {
    expect(
      intl({
        params: {
          on: 13182375813.47422,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('13,182,375,813.474');
  });
  test('Set locale', () => {
    expect(
      intl({
        params: {
          on: 13182375813.47422,
          locale: 'de',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('13.182.375.813,474');
  });
  test('Set options', () => {
    expect(
      intl({
        params: {
          on: 13182375813.47422,
          options: { style: 'unit', unit: 'mile-per-hour' },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('13,182,375,813.474 mph');
  });
});

describe('_intl.relativeTimeFormat', () => {
  const methodName = 'relativeTimeFormat';
  test('only unit specified', () => {
    expect(
      intl({
        params: {
          on: 4,
          unit: 'day',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('in 4 days');
  });
  test('Set locale', () => {
    expect(
      intl({
        params: {
          on: 4,
          unit: 'day',
          locale: 'fr',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('dans 4 jours');
  });
  test('Set options', () => {
    expect(
      intl({
        params: {
          on: 1,
          unit: 'day',
          options: { numeric: 'auto' },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('tomorrow');
  });
});
