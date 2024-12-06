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

import nunjucks from 'nunjucks';
import urlQueryFilter from './urlQueryFilter.js';

export const nunjucksEnv = new nunjucks.Environment();
nunjucksEnv.addFilter('urlQuery', urlQueryFilter);

describe('urlQueryFilter', () => {
  test('should return only url', () => {
    const input = {
      url: 'test',
    };
    const output = urlQueryFilter(input.url);
    expect(output).toEqual('test');
  });

  test('should return url with query parameters', () => {
    const input = {
      url: 'test',
      params: {
        a: 1,
        b: 'b',
      },
    };
    const output = urlQueryFilter(input.url, input.params);
    expect(output).toEqual('test?a=1&b=b');
  });

  test('should return undefined when no url provided', () => {
    const output = urlQueryFilter();
    expect(output).toEqual(undefined);
  });

  test('should return undefined when null url provided', () => {
    const input = {
      url: null,
      params: {
        a: 1,
        b: 'b',
      },
    };
    const output = urlQueryFilter(input.url, input.params);
    expect(output).toEqual(undefined);
  });

  test('should install urlQuery filter in nunjucks and return url', () => {
    const templateString = '{{ url | urlQuery }}';
    const input = {
      url: 'test',
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test');
  });

  test('should install urlQuery filter in nunjucks and return url with query parameters separated by &', () => {
    const templateString = '{{ url | urlQuery(params) | safe }}';
    const input = {
      url: 'test',
      params: {
        a: 1,
        b: 'b',
      },
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test?a=1&b=b');
  });

  test('should install urlQuery filter in nunjucks and return url with query parameters separated by &amp;', () => {
    const templateString = '{{ url | urlQuery(params) }}';
    const input = {
      url: 'test',
      params: {
        a: 1,
        b: 'b',
      },
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test?a=1&amp;b=b');
  });
});
