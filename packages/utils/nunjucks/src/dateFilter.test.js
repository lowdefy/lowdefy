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
/*
  DERIVED FROM:
  nunjucks-date-filter
  https://github.com/piwi/nunjucks-date-filter

  Copyright (c) 2015 Pierre Cassat
  Licensed under the Apache 2.0 license.
*/

import nunjucks from 'nunjucks';
import moment from 'moment';
import dateFilter from './dateFilter.js';

const testDate = new Date('2015-03-21');
const testMoment = moment(testDate);
const testMomentPlus = moment(testDate).add(7, 'days');
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
    expect(dateFilter(testDate)).toEqual(testMoment.format());
  });

  test('using "' + testFormat + '" arg', () => {
    expect(dateFilter(testDate, testFormat)).toEqual(testMoment.format(testFormat));
  });
});

describe('dateFunction - moment method calls', () => {
  test('using the "add" method', () => {
    expect(dateFilter(testDate, 'add', 7, 'days').format()).toEqual(testMomentPlus.format());
  });
  test('using the "utc" method', () => {
    expect(dateFilter(testDate, 'utc').format()).toEqual(moment(testDate).utc().format());
  });
});

describe('nunjucksFilter - filter installation', () => {
  test('using default filter name "date" manually', () => {
    env.addFilter('date', dateFilter);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testMoment.format());
  });

  test('using filter auto-install with default filter name', () => {
    dateFilter.install(env);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testMoment.format());
  });

  test('using filter auto-install with default filter name and no "env"', () => {
    dateFilter.install();
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testMoment.format());
  });

  test('using filter auto-install with custom filter name', () => {
    dateFilter.install(env, testFilterName);
    expect(typeof renderNunjucks(testFilterName)).toEqual('string');
    expect(renderNunjucks(testFilterName)).toEqual(testMoment.format());
  });
});

describe('nunjucksFilter - default date format', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(dateFilter(testDate)).toEqual(testMoment.format(testDefFormat));
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
      testMoment.format(testFormat)
    );
  });
});

describe('nunjucksFilter - format calls with custom default date format', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(typeof renderNunjucks()).toEqual('string');
    expect(renderNunjucks()).toEqual(testMoment.format(testDefFormat));
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
      testMomentPlus.format()
    );
  });
  test('utc method', () => {
    expect(renderNunjucks('date', '{{ my_date | date("utc") | date }}')).toEqual(
      moment(testDate).utc().format()
    );
  });
});

describe('nunjucksFilter - return nunjucks errors', () => {
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(renderNunjucks('date', '{{ my_date | date(111)}}')).toEqual(
      'TypeError: format.match is not a function'
    );
    dateFilter.setDefaultFormat(null);
  });
  test('using no arg', () => {
    env.addFilter('date', dateFilter);
    dateFilter.setDefaultFormat(testDefFormat);
    expect(renderNunjucks('date', '{{ false | date }}')).toEqual('Invalid date');
    dateFilter.setDefaultFormat(null);
  });
});

describe('dateFilter - edge cases', () => {
  test('none', () => {
    expect(dateFilter(null)).toEqual('');
    expect(dateFilter(undefined)).toEqual('');
  });
  test('booleans', () => {
    expect(dateFilter(true)).toEqual('Invalid date');
    expect(dateFilter(false)).toEqual('Invalid date');
  });
  test('strings', () => {
    expect(dateFilter('')).toEqual('Invalid date');
    expect(dateFilter('x')).toEqual('Invalid date');
    expect(dateFilter('2020-01-02')).toEqual(moment('2020-01-02').format());
  });
  test('arrays and objects', () => {
    expect(dateFilter([])).toEqual('Invalid date');
    expect(dateFilter({})).toEqual('Invalid date');
  });
  test('numbers', () => {
    expect(dateFilter(0)).toEqual(moment(0).format());
    expect(dateFilter(1)).toEqual(moment(1).format());
    expect(dateFilter(-1)).toEqual(moment(-1).format());
    expect(dateFilter(0.1)).toEqual(moment(0.1).format());
    expect(dateFilter(-0.1)).toEqual(moment(-0.1).format());
  });
});
