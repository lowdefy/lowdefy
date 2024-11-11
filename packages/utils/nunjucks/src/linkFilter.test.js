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
import linkFilter from './linkFilter.js';

export const nunjucksEnv = new nunjucks.Environment();
nunjucksEnv.addFilter('link', linkFilter);

describe('linkFilter', () => {
  test('should return only url', () => {
    const input = {
      url: 'test',
    };
    const output = linkFilter(input.url);
    expect(output).toEqual('test');
  });

  test('should return url with query parameters', () => {
    const input = {
      url: 'test',
      urlQuery: {
        a: 1,
        b: 'b',
      },
    };
    const output = linkFilter(input.url, input.urlQuery);
    expect(output).toEqual('test?a=1&b=b');
  });

  test('should return undefined when no url provided', () => {
    const output = linkFilter();
    expect(output).toEqual(undefined);
  });

  test('should return undefined when null url provided', () => {
    const input = {
      url: null,
      urlQuery: {
        a: 1,
        b: 'b',
      },
    };
    const output = linkFilter(input.url, input.urlQuery);
    expect(output).toEqual(undefined);
  });

  test('should install link filter in nunjucks and return url', () => {
    const templateString = '{{ url | link }}';
    const input = {
      url: 'test',
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test');
  });

  test('should install link filter in nunjucks and return url with query parameters separated by &', () => {
    const templateString = '{{ url | link(urlQuery) | safe }}';
    const input = {
      url: 'test',
      urlQuery: {
        a: 1,
        b: 'b',
      },
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test?a=1&b=b');
  });

  test('should install link filter in nunjucks and return url with query parameters separated by &amp;', () => {
    const templateString = '{{ url | link(urlQuery) }}';
    const input = {
      url: 'test',
      urlQuery: {
        a: 1,
        b: 'b',
      },
    };
    const output = nunjucksEnv.renderString(templateString, input);
    expect(output).toBe('test?a=1&amp;b=b');
  });
});
