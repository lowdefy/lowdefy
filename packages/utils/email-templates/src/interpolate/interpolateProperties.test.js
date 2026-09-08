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

import interpolateProperties from './interpolateProperties.js';

test('interpolateProperties interpolates plain fields without html escaping', () => {
  const result = interpolateProperties({
    properties: { subject: 'New item from {{ name }}', title: '{{ name }}' },
    data: { name: 'Tom & Jerry' },
  });
  expect(result).toEqual({
    subject: 'New item from Tom & Jerry',
    title: 'Tom & Jerry',
  });
});

test('interpolateProperties escapes markdown characters in data for markdown fields', () => {
  const result = interpolateProperties({
    properties: { message: 'Comment: {{ comment }}' },
    data: { comment: '[click](https://evil.example)' },
    markdownProperties: ['message'],
  });
  expect(result.message).toEqual('Comment: \\[click\\]\\(https\\:\\/\\/evil\\.example\\)');
});

test('interpolateProperties does not escape data for fields not listed in markdownProperties', () => {
  const result = interpolateProperties({
    properties: { subject: '{{ comment }}' },
    data: { comment: '[click](https://evil.example)' },
    markdownProperties: ['message'],
  });
  expect(result.subject).toEqual('[click](https://evil.example)');
});

test('interpolateProperties supports nunjucks conditionals', () => {
  const result = interpolateProperties({
    properties: {
      subject: '{% if urgent %}URGENT: {% endif %}{{ title }}',
    },
    data: { urgent: true, title: 'Server down' },
  });
  expect(result.subject).toEqual('URGENT: Server down');
});

test('interpolateProperties interpolates nested arrays and objects', () => {
  const result = interpolateProperties({
    properties: {
      metadata: [
        { label: 'Status', value: '{{ status }}' },
        { label: 'Owner', value: '{{ owner.name }}' },
      ],
      quote: { text: '{{ quote }}', author: '{{ owner.name }}' },
    },
    data: { status: 'Open', owner: { name: 'Jane' }, quote: 'Looks good' },
  });
  expect(result).toEqual({
    metadata: [
      { label: 'Status', value: 'Open' },
      { label: 'Owner', value: 'Jane' },
    ],
    quote: { text: 'Looks good', author: 'Jane' },
  });
});

test('interpolateProperties matches markdownProperties with array indices stripped', () => {
  const result = interpolateProperties({
    properties: {
      metadata: [{ label: 'Note', value: '{{ note }}' }],
    },
    data: { note: '**bold**' },
    markdownProperties: ['metadata.value'],
  });
  expect(result.metadata[0].value).toEqual('\\*\\*bold\\*\\*');
});

test('interpolateProperties matches nested markdownProperties paths', () => {
  const result = interpolateProperties({
    properties: { quote: { text: '{{ note }}', author: '{{ note }}' } },
    data: { note: '_i_' },
    markdownProperties: ['quote.text'],
  });
  expect(result.quote.text).toEqual('\\_i\\_');
  expect(result.quote.author).toEqual('_i_');
});

test('interpolateProperties passes non-string values through', () => {
  const result = interpolateProperties({
    properties: { count: 3, enabled: false, nothing: null, subject: '{{ name }}' },
    data: { name: 'Jane' },
  });
  expect(result).toEqual({ count: 3, enabled: false, nothing: null, subject: 'Jane' });
});

test('interpolateProperties does not mutate the input properties', () => {
  const properties = { subject: '{{ name }}', metadata: [{ label: 'A', value: '{{ name }}' }] };
  interpolateProperties({ properties, data: { name: 'Jane' } });
  expect(properties).toEqual({
    subject: '{{ name }}',
    metadata: [{ label: 'A', value: '{{ name }}' }],
  });
});

test('interpolateProperties throws on invalid nunjucks templates', () => {
  expect(() =>
    interpolateProperties({
      properties: { subject: '{% if %}' },
      data: {},
    })
  ).toThrow();
});
