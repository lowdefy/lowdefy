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

import { validate } from '@lowdefy/ajv';
import Elasticsearch from './Elasticsearch.js';
import { expect, test } from 'vitest';

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

test('valid connection schema, Elastic Cloud', () => {
  const connection = {
    cloud: {
      id: 'name:bG9jYWxob3N0JGFiY2QkZWZnaA==',
    },
    auth: {
      username: 'elastic',
      password: 'changeme',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, client 9 options', () => {
  const connection = {
    node: {
      url: 'https://localhost:9200',
      tls: {
        rejectUnauthorized: true,
      },
      agent: {
        connections: 10,
      },
    },
    tls: {
      ca: 'certificate',
    },
    caFingerprint: 'AA:BB',
    auth: {
      bearer: 'token',
    },
    agent: {
      keepAliveTimeout: 1000,
      connections: 100,
    },
    compression: true,
    requestTimeout: 30000,
    disablePrototypePoisoningProtection: false,
    serverMode: 'stack',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('properties node, nodes and cloud are missing', () => {
  const connection = {
    index: 'foo',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Elasticsearch connection should have exactly one of the properties "node", "nodes" or "cloud".'
  );
});

test('property ssl is rejected with the new name', () => {
  const connection = {
    node: 'https://foo',
    ssl: {
      rejectUnauthorized: false,
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'was renamed to "tls" in Lowdefy 8 (Elasticsearch client 9). Move these options to "tls"'
  );
});

test('node property ssl is rejected with the new name', () => {
  const connection = {
    node: {
      url: 'https://foo',
      ssl: {
        rejectUnauthorized: false,
      },
    },
  };
  const { valid, errors } = validate({ schema, data: connection, returnErrors: true });
  expect(valid).toBe(false);
  expect(errors.map((error) => error.message)).toContain(
    'was renamed to "tls" in Lowdefy 8 (Elasticsearch client 9). Move these node options to "tls"'
  );
});

test('cloud username and password are rejected', () => {
  const connection = {
    cloud: {
      id: 'name:bG9jYWxob3N0JGFiY2QkZWZnaA==',
      username: 'elastic',
      password: 'changeme',
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Set "auth.username" on the connection instead'
  );
});

test('property suggestCompression is rejected', () => {
  const connection = {
    node: 'https://foo',
    suggestCompression: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'was removed in Lowdefy 8 (Elasticsearch client 9). Set "compression: true"'
  );
});

test('property proxy is rejected', () => {
  const connection = {
    node: 'https://foo',
    proxy: 'http://localhost:8080',
  };
  expect(() => validate({ schema, data: connection })).toThrow('is not supported.');
});

test('property agent with http.Agent options is rejected', () => {
  const connection = {
    node: 'https://foo',
    agent: {
      keepAlive: true,
      maxSockets: 10,
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'takes undici connection pool options'
  );
});

test('property agent false is rejected', () => {
  const connection = {
    node: 'https://foo',
    agent: false,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'should be an object of undici connection pool options'
  );
});

test('property compression gzip is rejected', () => {
  const connection = {
    node: 'https://foo',
    compression: 'gzip',
  };
  expect(() => validate({ schema, data: connection })).toThrow('must be boolean');
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
