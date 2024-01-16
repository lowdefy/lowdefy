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

import { validate } from '@lowdefy/ajv';
import Elasticsearch from './Elasticsearch.js';

const schema = Elasticsearch.schema;

test('All requests are present', () => {
  expect(Elasticsearch.requests.ElasticsearchSearch).toBeDefined();
});

test('valid connection schema, single node', () => {
  let connection = {
    node: 'http://localhost:9200',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    nodes: 'http://localhost:9200',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    node: {
      url: 'http://localhost:9200',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    node: {
      url: 'http://localhost:9200',
      id: 'test',
      headers: {
        'X-Foo': 'Bar',
      },
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    node: [
      {
        url: 'http://localhost:9200',
        id: 'test',
        headers: {
          'X-Foo': 'Bar',
        },
      },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    nodes: [
      {
        url: 'http://localhost:9200',
        id: 'test',
        headers: {
          'X-Foo': 'Bar',
        },
      },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, multiple nodes', () => {
  let connection = {
    node: [
      'https://node1.elasticsearch',
      'https://node2.elasticsearch:443',
      'http://x:y@node3.elasticsearch:1234/foo',
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    nodes: [
      'https://node1.elasticsearch',
      'https://node2.elasticsearch:443',
      'http://x:y@node3.elasticsearch:1234/foo',
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    node: [
      { url: 'https://node1.elasticsearch' },
      { url: 'https://node2.elasticsearch:443' },
      { url: 'http://x:y@node3.elasticsearch:1234/foo' },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    nodes: [
      { url: 'https://node1.elasticsearch' },
      { url: 'https://node2.elasticsearch:443' },
      { url: 'http://x:y@node3.elasticsearch:1234/foo' },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    node: [
      {
        url: 'https://node1.elasticsearch',
        id: 'test1',
        headers: {
          'X-Foo': 'Bar',
        },
      },
      {
        url: 'https://node2.elasticsearch:443',
        id: 'test2',
        headers: {
          'X-Foo': 'Bar',
        },
      },
      {
        url: 'http://x:y@node3.elasticsearch:1234/foo',
        id: 'test3',
        headers: {
          'X-Foo': 'Bar',
        },
      },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    nodes: [
      {
        url: 'https://node1.elasticsearch',
        id: 'test1',
        headers: {
          'X-Foo': 'Bar',
        },
      },
      {
        url: 'https://node2.elasticsearch:443',
        id: 'test2',
        headers: {
          'X-Foo': 'Bar',
        },
      },
      {
        url: 'http://x:y@node3.elasticsearch:1234/foo',
        id: 'test3',
        headers: {
          'X-Foo': 'Bar',
        },
      },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('properties node and nodes are missing', () => {
  const connection = {
    index: 'foo',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection should have required property "node" or "nodes".'
  );
});

test('property maxRetries is lower than 0', () => {
  const connection = {
    node: 'https://foo',
    maxRetries: -3,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection "maxRetries" should be 0 or greater'
  );
});

test('property requestTimeout is 0 or lower', () => {
  let connection = {
    node: 'https://foo',
    requestTimeout: 0,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection "requestTimeout" should be 1 or greater'
  );
  connection = {
    node: 'https://foo',
    requestTimeout: -500,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection "requestTimeout" should be 1 or greater'
  );
});

test('property pingTimeout is 0 or lower', () => {
  let connection = {
    node: 'https://foo',
    pingTimeout: 0,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection "pingTimeout" should be 1 or greater'
  );
  connection = {
    node: 'https://foo',
    pingTimeout: -500,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection "pingTimeout" should be 1 or greater'
  );
});

test('property index is not a string', () => {
  const connection = {
    node: 'https://foo',
    index: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection property "index" should be a string'
  );
});

test('property auth is not an object', () => {
  const connection = {
    node: 'https://foo',
    auth: 'password',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection property "auth" should be an object containing credentials'
  );
});

test('property auth is empty', () => {
  const connection = {
    node: 'https://foo',
    auth: {},
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection property "auth" should be an object containing credentials'
  );
});

test('property auth contains invalid basic auth credentials', () => {
  let connection = {
    node: 'https://foo',
    auth: {
      password: 'foo',
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection property "auth" should be an object containing credentials'
  );
});

test('property auth contains invalid API key credentials', () => {
  let connection = {
    node: 'https://foo',
    auth: {
      apiKey: true,
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection property "auth" should be an object containing credentials'
  );
});
