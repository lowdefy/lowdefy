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

import extractErrorProps from './extractErrorProps.js';

test('extractErrorProps extracts basic error properties', () => {
  const err = new Error('test message');
  const props = extractErrorProps(err);
  expect(props.message).toBe('test message');
  expect(props.name).toBe('Error');
  expect(props.stack).toBeDefined();
});

test('extractErrorProps returns falsy input unchanged', () => {
  expect(extractErrorProps(null)).toBeNull();
  expect(extractErrorProps(undefined)).toBeUndefined();
});

test('extractErrorProps extracts custom enumerable properties', () => {
  const err = new Error('test');
  err.code = 'ERR_CUSTOM';
  err.statusCode = 500;
  const props = extractErrorProps(err);
  expect(props.code).toBe('ERR_CUSTOM');
  expect(props.statusCode).toBe(500);
});

test('extractErrorProps recursively serializes Error cause', () => {
  const inner = new Error('inner error');
  inner.code = 'INNER';
  const outer = new Error('outer error', { cause: inner });
  const props = extractErrorProps(outer);
  expect(props.cause).toEqual(
    expect.objectContaining({
      message: 'inner error',
      name: 'Error',
      code: 'INNER',
    })
  );
  expect(props.cause.stack).toBeDefined();
});

test('extractErrorProps handles multi-level cause chain', () => {
  const root = new Error('root');
  const middle = new Error('middle', { cause: root });
  const top = new Error('top', { cause: middle });
  const props = extractErrorProps(top);
  expect(props.message).toBe('top');
  expect(props.cause.message).toBe('middle');
  expect(props.cause.cause.message).toBe('root');
  expect(props.cause.cause.cause).toBeUndefined();
});

test('extractErrorProps preserves non-Error cause as-is', () => {
  const err = new Error('test');
  err.cause = 'string cause';
  const props = extractErrorProps(err);
  expect(props.cause).toBe('string cause');
});

test('extractErrorProps skips class instance properties with circular refs', () => {
  class FakeSocket {
    constructor() {
      this.agent = { socket: this }; // circular reference
      this.connected = true;
    }
  }
  const err = new Error('connection failed');
  err.socket = new FakeSocket();
  err.code = 'ECONNREFUSED';
  const props = extractErrorProps(err);
  expect(props.code).toBe('ECONNREFUSED');
  expect(props.socket).toBeUndefined();
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps preserves array and Date properties', () => {
  const err = new Error('test');
  err.tags = ['network', 'timeout'];
  err.timestamp = new Date(1000);
  const props = extractErrorProps(err);
  expect(props.tags).toEqual(['network', 'timeout']);
  expect(props.timestamp).toEqual(new Date(1000));
});

test('extractErrorProps recursively extracts Error-valued properties other than cause', () => {
  const err = new Error('outer');
  err.original = new Error('original error');
  err.original.code = 'ORIG';
  const props = extractErrorProps(err);
  expect(props.original.message).toBe('original error');
  expect(props.original.code).toBe('ORIG');
  expect(props.original.stack).toBeDefined();
});

test('extractErrorProps preserves plain object properties', () => {
  const err = new Error('test');
  err.details = { field: 'name', reason: 'required' };
  const props = extractErrorProps(err);
  expect(props.details).toEqual({ field: 'name', reason: 'required' });
});

test('extractErrorProps preserves null property values', () => {
  const err = new Error('test');
  err.response = null;
  const props = extractErrorProps(err);
  expect(props.response).toBeNull();
});

test('extractErrorProps handles circular Error references without infinite recursion', () => {
  const errA = new Error('error A');
  const errB = new Error('error B');
  errA.original = errB;
  errB.original = errA;
  const props = extractErrorProps(errA);
  expect(props.message).toBe('error A');
  expect(props.original.message).toBe('error B');
  expect(props.original.original).toBeUndefined();
});

test('extractErrorProps handles self-referencing cause without infinite recursion', () => {
  const err = new Error('self ref');
  Object.defineProperty(err, 'cause', { value: err, enumerable: false });
  const props = extractErrorProps(err);
  expect(props.message).toBe('self ref');
  expect(props.cause).toBeUndefined();
});

test('extractErrorProps caps cause chain depth at 3', () => {
  const e0 = new Error('depth 0');
  const e1 = new Error('depth 1', { cause: e0 });
  const e2 = new Error('depth 2', { cause: e1 });
  const e3 = new Error('depth 3', { cause: e2 });
  const e4 = new Error('depth 4', { cause: e3 });
  const props = extractErrorProps(e4);
  expect(props.message).toBe('depth 4');
  expect(props.cause.message).toBe('depth 3');
  expect(props.cause.cause.message).toBe('depth 2');
  expect(props.cause.cause.cause.message).toBe('depth 1');
  expect(props.cause.cause.cause.cause).toBeUndefined();
});

test('extractErrorProps deep-cleans plain objects containing class instances with circular refs', () => {
  class FakeClientRequest {
    constructor() {
      this.res = null; // set below to create cycle
    }
  }
  class FakeIncomingMessage {
    constructor(req) {
      this.req = req;
    }
  }
  const req = new FakeClientRequest();
  const res = new FakeIncomingMessage(req);
  req.res = res; // circular: req.res.req === req

  const err = new Error('Http response 502: Bad Gateway');
  err.response = {
    status: 502,
    statusText: 'Bad Gateway',
    request: req,
    headers: { 'content-type': 'text/html' },
  };

  const props = extractErrorProps(err);
  expect(props.message).toBe('Http response 502: Bad Gateway');
  expect(props.response.status).toBe(502);
  expect(props.response.statusText).toBe('Bad Gateway');
  expect(props.response.headers).toEqual({ 'content-type': 'text/html' });
  expect(props.response.request).toBe('[Object: FakeClientRequest]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps replaces circular refs within plain objects with marker', () => {
  const a = { name: 'a' };
  const b = { name: 'b', ref: a };
  a.ref = b; // circular

  const err = new Error('circular plain objects');
  err.data = a;

  const props = extractErrorProps(err);
  expect(props.data.name).toBe('a');
  expect(props.data.ref.name).toBe('b');
  expect(props.data.ref.ref).toBe('[Circular]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps truncates plain objects nested beyond MAX_OBJECT_DEPTH', () => {
  // Build a chain 7 levels deep
  let obj = { value: 'leaf' };
  for (let i = 0; i < 7; i++) {
    obj = { nested: obj };
  }
  const err = new Error('deep nesting');
  err.data = obj;

  const props = extractErrorProps(err);
  // data is objectDepth 1, each .nested increments
  // At depth > 5, cleanValue returns '[Truncated]'
  let cursor = props.data;
  let depth = 1; // data itself is depth 1
  while (cursor && typeof cursor === 'object' && cursor.nested) {
    cursor = cursor.nested;
    depth++;
  }
  expect(cursor).toBe('[Truncated]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps cleans arrays containing class instances', () => {
  class FakeSocket {
    constructor() {
      this.connected = true;
    }
  }
  const err = new Error('mixed array');
  err.items = ['ok', 42, new FakeSocket(), { nested: true }, null];

  const props = extractErrorProps(err);
  expect(props.items[0]).toBe('ok');
  expect(props.items[1]).toBe(42);
  expect(props.items[2]).toBe('[Object: FakeSocket]');
  expect(props.items[3]).toEqual({ nested: true });
  expect(props.items[4]).toBeNull();
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps cleans non-Error cause with nested class instances', () => {
  class FakeAgent {
    constructor() {
      this.sockets = {};
    }
  }
  const err = new Error('request failed');
  err.cause = { response: { status: 500 }, agent: new FakeAgent() };

  const props = extractErrorProps(err);
  expect(props.cause.response).toEqual({ status: 500 });
  expect(props.cause.agent).toBe('[Object: FakeAgent]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps extracts errors nested inside plain object properties', () => {
  const deep = new Error('deep cause');
  deep.code = 'DEEP';
  const inner = new Error('inner error', { cause: deep });
  inner.code = 'INNER';
  const err = new Error('outer');
  err.context = { operation: 'save', inner: inner };

  const props = extractErrorProps(err);
  expect(props.context.operation).toBe('save');
  expect(props.context.inner.message).toBe('inner error');
  expect(props.context.inner.code).toBe('INNER');
  expect(props.context.inner.cause.message).toBe('deep cause');
  expect(props.context.inner.cause.code).toBe('DEEP');
  expect(() => JSON.stringify(props)).not.toThrow();
});
