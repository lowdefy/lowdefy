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
/*
  DERIVED FROM:
  nunjucks-date-filter
  https://github.com/piwi/nunjucks-date-filter

  Copyright (c) 2015 Pierre Cassat
  Licensed under the Apache 2.0 license.
*/

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import nunjucks from 'nunjucks';
import dateFilter from './dateFilter.js';

dayjs.extend(utc);

const testDate = new Date('2015-03-21');
const testDayjs = dayjs(testDate);
const testDayjsPlus = dayjs(testDate).add(7, 'days');
const testFilterName = 'custom_filter';
const testFormat = 'YYYY';
const testDefFormat = 'YYYY-MM-DD';

const env = new nunjucks.Environment();
const renderNunjucks = (filter, str) => {
  if (str === undefined) {
    str = `{{ my_date | ${filter ?? 'date'} }}`;
  }
  return env.renderString(str, { my_date: testDate });
};

describe('dateFunction - format arg', () => {
  test('no arg - using default format', () => {
    expect(dateFilter(testDate)).toEqual(testDayjs.format());
  });

  test('using "' + testFormat + '" arg', () => {
    expect(dateFilter(testDate, testFormat)).toEqual(testDayjs.format(testFormat));
  });
});

describe('dateFunction - moment method calls', () => {
  test('using the "add" method', () => {
    expect(dateFilter(testDate, 'add', 7, 'days').format()).toEqual(testDayjsPlus.format());
  });
  test('using the "utc" method', () => {
    expect(dateFilter(testDate, 'utc').format()).toEqual(dayjs(testDate).utc().format());
  });
});

describe('nunjucksFilter - filter installation', () => {
  test('using default filter name "date" manually', () => {
    env.addFilter('date', dateFilter);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testDayjs.format());
  });

  test('using filter auto-install with default filter name', () => {
    dateFilter.install(env);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testDayjs.format());
  });

  test('using filter auto-install with default filter name and no "env"', () => {
    dateFilter.install();
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testDayjs.format());
  });

  test('using filter auto-install with custom filter name', () => {
    dateFilter.install(env, testFilterName);
    expect(typeof renderNunjucks(testFilterName)).toEqual('string');
    expect(renderNunjucks(testFilterName)).toEqual(testDayjs.format());
  });
});

describe('nunjucksFilter - default date format', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(dateFilter(testDate)).toEqual(testDayjs.format(testDefFormat));
    dateFilter.setDefaultFormat(null);
  });
});

describe('nunjucksFilter - format calls', () => {
  test('using "' + testFormat + '" arg', () => {
    env.addFilter('date', dateFilter);
    expect(typeof renderNunjucks('date', '{{ my_date | date("' + testFormat + '") }}')).toEqual(
      'string'
    );
    expect(renderNunjucks('date', '{{ my_date | date("' + testFormat + '") }}')).toEqual(
      testDayjs.format(testFormat)
    );
  });
});

describe('nunjucksFilter - format calls with custom default date format', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testDayjs.format(testDefFormat));
    dateFilter.setDefaultFormat(null);
  });
});

describe('nunjucksFilter - moment methods calls', () => {
  test('using method chaining', () => {
    env.addFilter('date', dateFilter);
    expect(typeof renderNunjucks('date', '{{ my_date | date("add", 7, "days") | date }}')).toEqual(
      'string'
    );
    expect(renderNunjucks('date', '{{ my_date | date("add", 7, "days") | date }}')).toEqual(
      testDayjsPlus.format()
    );
  });
  test('utc method', () => {
    expect(renderNunjucks('date', '{{ my_date | date("utc") | date }}')).toEqual(
      dayjs(testDate).utc().format()
    );
  });
});

describe('nunjucksFilter - return nunjucks errors', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(renderNunjucks('date', '{{ my_date | date(111)}}')).toMatch(/^TypeError:/);
    dateFilter.setDefaultFormat(null);
  });
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(renderNunjucks('date', '{{ false | date }}')).toEqual('Invalid Date');
    dateFilter.setDefaultFormat(null);
  });
});

describe('dateFilter - edge cases', () => {
  test('none', () => {
    expect(dateFilter(null)).toEqual('');
    expect(dateFilter(undefined)).toEqual('');
  });
  test('booleans', () => {
    expect(dateFilter(true)).toEqual('Invalid Date');
    expect(dateFilter(false)).toEqual('Invalid Date');
  });
  test('strings', () => {
    expect(dateFilter('')).toEqual('Invalid Date');
    expect(dateFilter('x')).toEqual('Invalid Date');
    expect(dateFilter('2020-01-02')).toEqual(dayjs('2020-01-02').format());
  });
  test('arrays and objects', () => {
    expect(dateFilter([])).toEqual('Invalid Date');
    expect(dateFilter({})).toEqual('Invalid Date');
  });
  test('numbers', () => {
    expect(dateFilter(0)).toEqual(dayjs(0).format());
    expect(dateFilter(1)).toEqual(dayjs(1).format());
    expect(dateFilter(-1)).toEqual(dayjs(-1).format());
    expect(dateFilter(0.1)).toEqual(dayjs(0.1).format());
    expect(dateFilter(-0.1)).toEqual(dayjs(-0.1).format());
  });
});
