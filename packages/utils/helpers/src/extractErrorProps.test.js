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
import serializer from './serializer.js';

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

test('extractErrorProps marks class instance properties with a type marker instead of dropping them', () => {
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
  expect(props.socket).toBe('[Object: FakeSocket]');
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
  expect(props.original.original).toBe('[Circular]');
});

test('extractErrorProps handles self-referencing cause without infinite recursion', () => {
  const err = new Error('self ref');
  Object.defineProperty(err, 'cause', { value: err, enumerable: false });
  const props = extractErrorProps(err);
  expect(props.message).toBe('self ref');
  expect(props.cause).toBe('[Circular]');
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
  expect(props.cause.cause.cause.cause).toBe('[Truncated]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps reports a circular cause as [Circular] instead of dropping it', () => {
  const a = new Error('a');
  const b = new Error('b');
  a.cause = b;
  b.cause = a;
  const props = extractErrorProps(a);
  expect(props.message).toBe('a');
  expect(props.cause.message).toBe('b');
  expect(props.cause.cause).toBe('[Circular]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps reports a circular cause at the depth limit as [Circular], not [Truncated]', () => {
  const e0 = new Error('depth 0');
  const e1 = new Error('depth 1', { cause: e0 });
  const e2 = new Error('depth 2', { cause: e1 });
  const e3 = new Error('depth 3', { cause: e2 });
  e0.cause = e3; // circular: e0 -> e1 -> e2 -> e3 -> e0, closing the loop past MAX_CAUSE_DEPTH
  const props = extractErrorProps(e3);
  expect(props.message).toBe('depth 3');
  expect(props.cause.message).toBe('depth 2');
  expect(props.cause.cause.message).toBe('depth 1');
  expect(props.cause.cause.cause.message).toBe('depth 0');
  expect(props.cause.cause.cause.cause).toBe('[Circular]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps marks an own key holding an already-seen Error as [Circular]', () => {
  const shared = new Error('shared');
  const err = new Error('outer');
  err.cause = shared;
  err.detail = shared;
  const props = extractErrorProps(err);
  expect(props.cause.message).toBe('shared');
  expect(props.detail).toBe('[Circular]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps marks an own key holding a class instance as [Object: <Name>]', () => {
  class FakeSocket {}
  const err = new Error('boom');
  err.socket = new FakeSocket();
  const props = extractErrorProps(err);
  expect(props.socket).toBe('[Object: FakeSocket]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps produces byte-identical markers for an own and a nested class instance', () => {
  class FakeSocket {}
  const err = new Error('boom');
  err.socket = new FakeSocket();
  err.meta = { socket: new FakeSocket() };
  const props = extractErrorProps(err);
  expect(props.socket).toBe('[Object: FakeSocket]');
  expect(props.meta.socket).toBe('[Object: FakeSocket]');
  expect(props.socket).toBe(props.meta.socket);
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps falls back to [Object: unknown] for a class instance with no constructor', () => {
  // A prototype chain with no `constructor` anywhere on it (proto's own proto is null,
  // so Object.prototype.constructor is never inherited) - not a plain object, since its
  // prototype is neither Object.prototype nor null, but `constructor` is undefined.
  const proto = Object.create(null);
  const err = new Error('boom');
  err.thing = Object.create(proto);
  expect(() => extractErrorProps(err)).not.toThrow();
  const props = extractErrorProps(err);
  expect(props.thing).toBe('[Object: unknown]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps falls back to [Object: unknown] for an anonymous class instance', () => {
  // An anonymous class has '' as its constructor name, not undefined, so the marker
  // has to fall back on the empty string or it carries no type name at all.
  const err = new Error('boom');
  err.thing = new (class {})();
  err.meta = { thing: new (class {})() };
  const props = extractErrorProps(err);
  expect(props.thing).toBe('[Object: unknown]');
  expect(props.meta.thing).toBe('[Object: unknown]');
  expect(props.thing).toBe(props.meta.thing);
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps marks a function-valued own key as [Function: <name>] instead of leaking it', () => {
  const err = new Error('boom');
  err.fn = function secret() {};
  const props = extractErrorProps(err);
  expect(props.fn).toBe('[Function: secret]');
  expect(typeof props.fn).toBe('string');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps falls back to [Function: unknown] for an anonymous function-valued own key', () => {
  const err = new Error('boom');
  err.fn = () => 1;
  const props = extractErrorProps(err);
  expect(props.fn).toBe('[Function: unknown]');
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps produces byte-identical markers for an own and a nested function', () => {
  const err = new Error('boom');
  err.fn = function secret() {};
  err.meta = { fn: function secret() {} };
  err.items = [function secret() {}];
  const props = extractErrorProps(err);
  expect(props.fn).toBe('[Function: secret]');
  expect(props.meta.fn).toBe('[Function: secret]');
  expect(props.items[0]).toBe('[Function: secret]');
  expect(props.fn).toBe(props.meta.fn);
  expect(props.fn).toBe(props.items[0]);
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps function marker exposes only the name, never the closed-over source', () => {
  const secretHost = 'internal-host';
  const err = new Error('boom');
  err.fn = function connect() {
    return secretHost;
  };
  const props = extractErrorProps(err);
  expect(props.fn).toBe('[Function: connect]');
  expect(props.fn).not.toEqual(expect.stringContaining('internal-host'));
  expect(() => JSON.stringify(props)).not.toThrow();
});

test('extractErrorProps class-instance marker exposes only the type name, never instance internals', () => {
  class FakeSocket {
    constructor() {
      this.host = 'internal-host';
      this.port = 1234;
    }
  }
  const err = new Error('boom');
  err.socket = new FakeSocket();
  const props = extractErrorProps(err);
  expect(props.socket).toBe('[Object: FakeSocket]');
  expect(props.socket).not.toEqual(expect.stringContaining('internal-host'));
  expect(props.socket).not.toEqual(expect.stringContaining('1234'));
  expect(() => JSON.stringify(props)).not.toThrow();
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
    depth += 1;
  }
  expect(cursor).toBe('[Truncated]');
  // MAX_OBJECT_DEPTH is 5, so depth 6 is the first level that truncates
  expect(depth).toBe(6);
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

// The omit option, as a mechanism only: extractErrorProps applies whatever keys
// the callback hands it, at every error node it builds. Which fields any audience
// may see is the caller's policy and is tested by the caller, not here.

function buildCauseChain() {
  const withProps = (error, level) => {
    error.configKey = `key-${level}`;
    error.code = `CODE_${level}`;
    return error;
  };
  const depth3 = withProps(new RangeError('depth 3'), 3);
  const depth2 = withProps(new TypeError('depth 2', { cause: depth3 }), 2);
  const depth1 = withProps(new SyntaxError('depth 1', { cause: depth2 }), 1);
  const depth0 = withProps(new Error('depth 0', { cause: depth1 }), 0);
  return { depth0, depth1, depth2, depth3 };
}

test('extractErrorProps omit removes a built-in field at the root and at every cause depth', () => {
  const { depth0 } = buildCauseChain();

  const props = extractErrorProps(depth0, { omit: () => ['stack'] });

  const levels = [props, props.cause, props.cause.cause, props.cause.cause.cause];
  expect(levels).toHaveLength(4);
  levels.forEach((level, index) => {
    expect(level.message).toBe(`depth ${index}`);
    expect(level.stack).toBeUndefined();
    expect('stack' in level).toBe(false);
  });
});

test('extractErrorProps omit removes an own enumerable field at the root and at every cause depth', () => {
  const { depth0 } = buildCauseChain();

  const props = extractErrorProps(depth0, { omit: () => ['configKey'] });

  const levels = [props, props.cause, props.cause.cause, props.cause.cause.cause];
  levels.forEach((level, index) => {
    expect('configKey' in level).toBe(false);
    expect(level.code).toBe(`CODE_${index}`);
  });
});

test('extractErrorProps omit is called once for each error node in the cause chain', () => {
  const { depth0, depth1, depth2, depth3 } = buildCauseChain();
  const nodes = [];

  extractErrorProps(depth0, {
    omit: (node) => {
      nodes.push(node);
      return [];
    },
  });

  expect(nodes).toHaveLength(4);
  expect(nodes[0]).toBe(depth0);
  expect(nodes[1]).toBe(depth1);
  expect(nodes[2]).toBe(depth2);
  expect(nodes[3]).toBe(depth3);
});

test('extractErrorProps omit applies to an Error held in an own enumerable property', () => {
  const err = new Error('outer');
  err.original = new Error('original error');
  err.original.code = 'ORIG';

  const props = extractErrorProps(err, { omit: () => ['stack'] });

  expect('stack' in props).toBe(false);
  expect(props.original.message).toBe('original error');
  expect(props.original.code).toBe('ORIG');
  expect('stack' in props.original).toBe(false);
});

test('extractErrorProps omit applies to an Error nested inside a plain-object cause', () => {
  const nested = new Error('nested in object');
  nested.code = 'NESTED';
  const err = new Error('outer');
  err.cause = { operation: 'save', inner: nested };

  const props = extractErrorProps(err, { omit: () => ['stack'] });

  expect(props.cause.operation).toBe('save');
  expect(props.cause.inner.message).toBe('nested in object');
  expect(props.cause.inner.code).toBe('NESTED');
  expect('stack' in props.cause.inner).toBe(false);
});

test('extractErrorProps omit applies to an Error nested inside an array', () => {
  const nested = new Error('nested in array');
  const err = new Error('outer');
  err.errors = ['ok', nested];

  const props = extractErrorProps(err, { omit: () => ['stack'] });

  expect(props.errors[0]).toBe('ok');
  expect(props.errors[1].message).toBe('nested in array');
  expect('stack' in props.errors[1]).toBe(false);
});

test('extractErrorProps omit applies to an Error nested inside an array in a plain-object cause', () => {
  const nested = new Error('nested in array in cause');
  const err = new Error('outer');
  err.cause = { failures: [nested] };

  const props = extractErrorProps(err, { omit: () => ['stack'] });

  expect(props.cause.failures[0].message).toBe('nested in array in cause');
  expect('stack' in props.cause.failures[0]).toBe(false);
});

test('extractErrorProps omit of fields leaves the cause chain walkable with name and message intact', () => {
  const { depth0 } = buildCauseChain();

  const props = extractErrorProps(depth0, { omit: () => ['stack', 'configKey'] });

  expect(props.name).toBe('Error');
  expect(props.message).toBe('depth 0');
  expect(props.cause.name).toBe('SyntaxError');
  expect(props.cause.message).toBe('depth 1');
  expect(props.cause.cause.name).toBe('TypeError');
  expect(props.cause.cause.message).toBe('depth 2');
  expect(props.cause.cause.cause.name).toBe('RangeError');
  expect(props.cause.cause.cause.message).toBe('depth 3');
});

test('extractErrorProps omit of cause drops the Error cause and keeps sibling fields', () => {
  const inner = new Error('inner');
  const err = new Error('outer', { cause: inner });
  err.code = 'OUTER_CODE';
  err.details = { field: 'name' };

  const props = extractErrorProps(err, { omit: () => ['cause'] });

  expect('cause' in props).toBe(false);
  expect(props.message).toBe('outer');
  expect(props.name).toBe('Error');
  expect(props.stack).toBeDefined();
  expect(props.code).toBe('OUTER_CODE');
  expect(props.details).toEqual({ field: 'name' });
});

test('extractErrorProps omit of cause drops a non-Error cause and keeps sibling fields', () => {
  const err = new Error('outer');
  err.cause = { status: 500 };
  err.code = 'OUTER_CODE';

  const props = extractErrorProps(err, { omit: () => ['cause'] });

  expect('cause' in props).toBe(false);
  expect(props.code).toBe('OUTER_CODE');
  expect(props.message).toBe('outer');
});

test('extractErrorProps omit receives the error node so a per-node decision applies', () => {
  const inner = new TypeError('inner');
  const err = new Error('outer', { cause: inner });

  const props = extractErrorProps(err, {
    omit: (node) => (node.name === 'TypeError' ? ['stack'] : []),
  });

  expect(props.stack).toBeDefined();
  expect(props.cause.message).toBe('inner');
  expect(props.cause.name).toBe('TypeError');
  expect('stack' in props.cause).toBe(false);
});

test('extractErrorProps omit can drop the cause of one node only, leaving deeper nodes of other names intact', () => {
  const depth2 = new Error('depth 2');
  const depth1 = new TypeError('depth 1', { cause: depth2 });
  const depth0 = new Error('depth 0', { cause: depth1 });

  const props = extractErrorProps(depth0, {
    omit: (node) => (node.name === 'TypeError' ? ['cause'] : []),
  });

  expect(props.message).toBe('depth 0');
  expect(props.cause.message).toBe('depth 1');
  expect('cause' in props.cause).toBe(false);
});

test('extractErrorProps omit returning undefined omits nothing', () => {
  const inner = new Error('inner');
  const err = new Error('outer', { cause: inner });
  err.code = 'CODE';

  expect(extractErrorProps(err, { omit: () => undefined })).toEqual(extractErrorProps(err));
});

test('extractErrorProps omit returning an empty array omits nothing', () => {
  const inner = new Error('inner');
  const err = new Error('outer', { cause: inner });
  err.code = 'CODE';

  expect(extractErrorProps(err, { omit: () => [] })).toEqual(extractErrorProps(err));
});

test('extractErrorProps without an omit option keeps message, name, stack, cause and own fields', () => {
  const inner = new Error('inner');
  const err = new Error('outer', { cause: inner });
  err.code = 'CODE';

  const props = extractErrorProps(err);

  expect(props.message).toBe('outer');
  expect(props.name).toBe('Error');
  expect(props.stack).toBeDefined();
  expect(props.code).toBe('CODE');
  expect(props.cause.message).toBe('inner');
  expect(props.cause.stack).toBeDefined();
});

test('extractErrorProps with an empty options object behaves the same as no options', () => {
  const inner = new Error('inner');
  const err = new Error('outer', { cause: inner });
  err.code = 'CODE';

  expect(extractErrorProps(err, {})).toEqual(extractErrorProps(err));
});

test('extractErrorProps does not mark an omitted plain-object cause as seen, so a shared property is not [Circular]', () => {
  const shared = { id: 'shared' };
  const err = new Error('outer');
  err.cause = shared;
  err.detail = shared;

  // Baseline: building the cause first marks `shared` as seen, so the sibling
  // property that points at the same object collapses to the circular marker.
  expect(extractErrorProps(err).detail).toBe('[Circular]');

  const props = extractErrorProps(err, { omit: () => ['cause'] });

  expect('cause' in props).toBe(false);
  expect(props.detail).toEqual({ id: 'shared' });
});

test('extractErrorProps does not mark an omitted Error cause as seen, so a shared property is still extracted', () => {
  const shared = new Error('shared');
  shared.code = 'SHARED';
  const err = new Error('outer', { cause: shared });
  err.detail = shared;

  // Baseline: the cause is built first, so the sibling pointing at the same
  // error is marked as already seen.
  expect(extractErrorProps(err).detail).toBe('[Circular]');

  const props = extractErrorProps(err, { omit: () => ['cause'] });

  expect('cause' in props).toBe(false);
  expect(props.detail.message).toBe('shared');
  expect(props.detail.code).toBe('SHARED');
});

test('extractErrorProps marks a bigint-valued own key as [BigInt: <digits>] instead of leaking it live', () => {
  const err = new Error('boom');
  err.v = 10n;
  const props = extractErrorProps(err);
  expect(props.v).toBe('[BigInt: 10]');
  expect(typeof props.v).toBe('string');
  expect(() => JSON.stringify(props)).not.toThrow();
  expect(() => serializer.copy(props)).not.toThrow();
});

test('extractErrorProps produces byte-identical markers for an own, nested and in-array bigint', () => {
  const err = new Error('boom');
  err.v = 10n;
  err.meta = { v: 10n };
  err.items = [10n];
  const props = extractErrorProps(err);
  expect(props.v).toBe('[BigInt: 10]');
  expect(props.meta.v).toBe('[BigInt: 10]');
  expect(props.items[0]).toBe('[BigInt: 10]');
  expect(props.v).toBe(props.meta.v);
  expect(props.v).toBe(props.items[0]);
  expect(() => JSON.stringify(props)).not.toThrow();
  expect(() => serializer.copy(props)).not.toThrow();
});

test('extractErrorProps preserves the [BigInt: <digits>] marker through serializer.copy', () => {
  const err = new Error('boom');
  err.v = 10n;
  err.meta = { v: 10n };
  err.items = [10n];
  const props = extractErrorProps(err);
  const copied = serializer.copy(props);
  expect(copied.v).toBe('[BigInt: 10]');
  expect(copied.meta.v).toBe('[BigInt: 10]');
  expect(copied.items[0]).toBe('[BigInt: 10]');
});

test('extractErrorProps marks a symbol-valued own key as [Symbol: description] instead of silently dropping it', () => {
  const err = new Error('boom');
  err.v = Symbol('token');
  const props = extractErrorProps(err);
  expect(props.v).toBe('[Symbol: token]');
  expect(typeof props.v).toBe('string');
  expect(() => JSON.stringify(props)).not.toThrow();
  expect(() => serializer.copy(props)).not.toThrow();
});

test('extractErrorProps falls back to [Symbol: unknown] for a descriptionless symbol-valued own key', () => {
  const err = new Error('boom');
  err.v = Symbol();
  const props = extractErrorProps(err);
  expect(props.v).toBe('[Symbol: unknown]');
});

test('extractErrorProps produces byte-identical markers for an own, nested and in-array symbol', () => {
  const err = new Error('boom');
  err.v = Symbol('token');
  err.meta = { v: Symbol('token') };
  err.items = [Symbol('token')];
  const props = extractErrorProps(err);
  expect(props.v).toBe('[Symbol: token]');
  expect(props.meta.v).toBe('[Symbol: token]');
  expect(props.items[0]).toBe('[Symbol: token]');
  expect(props.v).toBe(props.meta.v);
  expect(props.v).toBe(props.items[0]);
  expect(() => JSON.stringify(props)).not.toThrow();
  expect(() => serializer.copy(props)).not.toThrow();
});

test('extractErrorProps preserves the [Symbol: description] marker through serializer.copy instead of dropping the field', () => {
  const err = new Error('boom');
  err.v = Symbol('token');
  err.meta = { v: Symbol('token') };
  err.items = [Symbol('token')];
  const props = extractErrorProps(err);
  const copied = serializer.copy(props);
  expect(copied.v).toBe('[Symbol: token]');
  expect(copied.meta.v).toBe('[Symbol: token]');
  expect(copied.items[0]).toBe('[Symbol: token]');
});
