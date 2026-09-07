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

import path from 'path';
import { ConfigError, LowdefyInternalError, RequestError, UserError } from '@lowdefy/errors';

import redactErrorResponse from './redactErrorResponse.js';

const configDirectory = path.resolve('/app/config');

test('redactErrorResponse strips received and stack from the outermost error', () => {
  const error = new RequestError('Request failed.', {
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  const serialized = redactErrorResponse({}, error);
  expect(serialized['~e'].message).toBe('Request failed.');
  expect(serialized['~e'].received).toBeUndefined();
  expect(serialized['~e'].stack).toBeUndefined();
});

test('redactErrorResponse strips received and stack at every cause depth', () => {
  const depth3 = new Error('depth 3');
  depth3.received = { secret: 'depth-3-secret' };
  const depth2 = new Error('depth 2', { cause: depth3 });
  depth2.received = { secret: 'depth-2-secret' };
  const depth1 = new Error('depth 1', { cause: depth2 });
  depth1.received = { secret: 'depth-1-secret' };
  const error = new RequestError('depth 0', {
    cause: depth1,
    received: { secret: 'depth-0-secret' },
  });

  const serialized = redactErrorResponse({}, error);
  const root = serialized['~e'];
  const nodes = [root, root.cause, root.cause.cause, root.cause.cause.cause];

  // The whole chain must be reached, not just the outermost node - a policy that
  // only covers depth 0 is the defect this design exists to close.
  expect(nodes.map((node) => node.message)).toEqual(['depth 0', 'depth 1', 'depth 2', 'depth 3']);
  nodes.forEach((node) => {
    expect(node.received).toBeUndefined();
    expect(node.stack).toBeUndefined();
  });
  expect(JSON.stringify(serialized)).not.toContain('secret');
});

test('redactErrorResponse strips received and stack on an Error-valued own property', () => {
  const error = new ConfigError('Outer failed.');
  const nested = new Error('Nested in a property.');
  nested.received = { secret: 'property-secret' };
  error.innerError = nested;

  const serialized = redactErrorResponse({}, error);

  expect(serialized['~e'].innerError.message).toBe('Nested in a property.');
  expect(serialized['~e'].innerError.received).toBeUndefined();
  expect(serialized['~e'].innerError.stack).toBeUndefined();
});

test('redactErrorResponse strips received and stack on an Error nested inside a UserError cause', () => {
  const nested = new Error('Nested in a plain object.');
  nested.received = { secret: 'object-secret' };
  // A UserError keeps its non-Error cause, so this exercises the third emission
  // position: cleanValue handing an Error inside a plain object back to the
  // extractor.
  const error = new UserError('Thrown by config.', { cause: { wrapped: nested } });

  const serialized = redactErrorResponse({}, error);

  expect(serialized['~e'].cause.wrapped.message).toBe('Nested in a plain object.');
  expect(serialized['~e'].cause.wrapped.received).toBeUndefined();
  expect(serialized['~e'].cause.wrapped.stack).toBeUndefined();
});

test('redactErrorResponse keeps the cause chain itself so the browser can render the trace', () => {
  const root = new Error('Connection refused.');
  const error = new RequestError('Request failed.', { cause: root });

  const serialized = redactErrorResponse({}, error);

  // createBrowserLogger renders name + message per level - taking fields FROM
  // causes must never prune the causes themselves.
  expect(serialized['~e'].cause.name).toBe('Error');
  expect(serialized['~e'].cause.message).toBe('Connection refused.');
});

test('redactErrorResponse drops a non-Error cause on an internal error', () => {
  const error = new Error('Invalid routine.', {
    cause: { routine: { ':throw': { message: 'server-only config' } } },
  });

  const serialized = redactErrorResponse({}, error);

  expect(serialized['~e'].cause).toBeUndefined();
  expect(JSON.stringify(serialized)).not.toContain('server-only config');
});

test('redactErrorResponse keeps a non-Error cause and metaData on a UserError', () => {
  const error = new UserError('Order rejected.', {
    blockId: 'submit_button',
    cause: { reason: 'out of stock' },
    metaData: { orderId: 'ord_1' },
    pageId: 'checkout',
  });

  const serialized = redactErrorResponse({}, error);

  // The one class whose payload is author-authored and client-bound by design.
  expect(serialized['~e'].cause).toEqual({ reason: 'out of stock' });
  expect(serialized['~e'].metaData).toEqual({ orderId: 'ord_1' });
  expect(serialized['~e'].blockId).toBe('submit_button');
  expect(serialized['~e'].pageId).toBe('checkout');
});

test('redactErrorResponse keeps configKey, source and config', () => {
  const error = new ConfigError('Block type not found.', { configKey: 'abc123' });
  error.source = 'pages/home.yaml:5';
  error.config = 'root.pages[0:home].blocks[0:header]';

  const serialized = redactErrorResponse({}, error);

  // configKey names a node the client already holds, and the client's
  // createHandleError dedupe key needs it to separate same-message errors.
  expect(serialized['~e'].configKey).toBe('abc123');
  expect(serialized['~e'].source).toBe('pages/home.yaml:5');
  expect(serialized['~e'].config).toBe('root.pages[0:home].blocks[0:header]');
});

test('redactErrorResponse returns source config-relative when context.configDirectory is set', () => {
  const error = new ConfigError('Block type not found.');
  error.source = `${path.resolve(configDirectory, 'pages/home.yaml')}:5`;

  const serialized = redactErrorResponse({ configDirectory }, error);

  expect(serialized['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
});

test('redactErrorResponse leaves source unchanged when no configDirectory is set', () => {
  const error = new ConfigError('Block type not found.');
  error.source = 'pages/home.yaml:5';

  const serialized = redactErrorResponse({}, error);

  // Production does not set configDirectory today, so source is already
  // relative. This pins Decision 4 against the drift of someone setting it.
  expect(serialized['~e'].source).toBe('pages/home.yaml:5');
});

test('redactErrorResponse strips the prefix when configDirectory carries a trailing separator', () => {
  const error = new ConfigError('Block type not found.');
  error.source = `${path.resolve(configDirectory, 'pages/home.yaml')}:5`;

  const serialized = redactErrorResponse(
    { configDirectory: `${configDirectory}${path.sep}` },
    error
  );

  expect(serialized['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
});

test('redactErrorResponse strips the prefix when configDirectory is a relative path', () => {
  const error = new ConfigError('Block type not found.');
  // resolveConfigLocation built source with path.resolve(configDirectory, filePath),
  // so a relative configDirectory produces the same absolute path.
  error.source = `${path.resolve('some/app', 'pages/home.yaml')}:5`;

  const serialized = redactErrorResponse({ configDirectory: 'some/app' }, error);

  expect(serialized['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
});

test('redactErrorResponse leaves source unchanged when configDirectory does not match it', () => {
  const error = new ConfigError('Block type not found.');
  error.source = `${path.resolve('/elsewhere/pages/home.yaml')}:5`;

  const serialized = redactErrorResponse({ configDirectory }, error);

  expect(serialized['~e'].source).toBe(`${path.resolve('/elsewhere/pages/home.yaml')}:5`);
});

test('redactErrorResponse normalises a source with no line number', () => {
  const error = new ConfigError('Block type not found.');
  // resolveConfigLocation returns the bare path when no line number resolved.
  error.source = path.resolve(configDirectory, 'lowdefy.yaml');

  const serialized = redactErrorResponse({ configDirectory }, error);

  expect(serialized['~e'].source).toBe('lowdefy.yaml');
});

test('redactErrorResponse normalises source on a nested error node too', () => {
  const nested = new ConfigError('Inner failed.');
  nested.source = `${path.resolve(configDirectory, 'endpoints/admin.yaml')}:12`;
  const error = new ConfigError('Outer failed.', { cause: nested });
  error.source = `${path.resolve(configDirectory, 'pages/home.yaml')}:5`;

  const serialized = redactErrorResponse({ configDirectory }, error);

  expect(serialized['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
  expect(serialized['~e'].cause.source).toBe(`${path.join('endpoints', 'admin.yaml')}:12`);
  expect(JSON.stringify(serialized)).not.toContain(configDirectory);
});

test('redactErrorResponse leaves a source value inside author-written UserError data alone', () => {
  const authorSource = path.resolve(configDirectory, 'uploads/report.csv');
  const error = new UserError('Upload rejected.', {
    cause: { source: authorSource },
    metaData: { source: authorSource },
  });
  error.source = `${path.resolve(configDirectory, 'pages/upload.yaml')}:3`;

  const serialized = redactErrorResponse({ configDirectory }, error);

  // The policy preserves a UserError's cause and metaData because the author wrote
  // them, so a `source` key inside them is the app's value, not a config location.
  // The normalisation keys on the error-node shape, not on the key name.
  expect(serialized['~e'].cause.source).toBe(authorSource);
  expect(serialized['~e'].metaData.source).toBe(authorSource);
  expect(serialized['~e'].source).toBe(`${path.join('pages', 'upload.yaml')}:3`);
});

test('redactErrorResponse passes a null error through unchanged', () => {
  // Endpoint routes serialize the error field on success too, where it is null.
  expect(redactErrorResponse({}, null)).toBeNull();
});

test('redactErrorResponse passes an undefined error through unchanged', () => {
  expect(redactErrorResponse({}, undefined)).toBeUndefined();
});

test('redactErrorResponse does not throw when context is missing', () => {
  const error = new ConfigError('Block type not found.');
  error.source = 'pages/home.yaml:5';

  // errorHandler has an else branch for requests with no lowdefyContext.
  expect(redactErrorResponse(undefined, error)['~e'].source).toBe('pages/home.yaml:5');
  expect(redactErrorResponse(null, error)['~e'].message).toBe('Block type not found.');
});

test('redactErrorResponse keeps handled so the client does not log the error twice', () => {
  const error = new LowdefyInternalError('Unexpected condition.');
  error.handled = true;

  const serialized = redactErrorResponse({}, error);

  // A LowdefyInternalError never resolves a source, so handled is the only
  // signal the client has that the server already logged this one.
  expect(serialized['~e'].handled).toBe(true);
  expect(serialized['~e'].stack).toBeUndefined();
});
