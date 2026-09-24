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
import { ConfigError, RequestError, UserError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import redactErrorResponse from './redactErrorResponse.js';

const configDirectory = path.resolve('/app/config');

function createChain() {
  const root = new Error('connect ECONNREFUSED 10.0.0.5:5432');
  root.received = { password: 'root-secret' };
  const error = new RequestError('Request failed.', {
    cause: root,
    configKey: 'key-1',
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  error.source = `${path.resolve(configDirectory, 'requests/users.yaml')}:4`;
  error.config = 'root.pages[0:home].requests[0:users]';
  return error;
}

test('redactErrorResponse sends only the wire error in prod', () => {
  const payload = redactErrorResponse({ mode: 'prod', rid: 'rid-1' }, createChain());

  expect(payload).toEqual({
    '~e': {
      name: 'RequestError',
      message: 'Something went wrong.',
      configKey: 'key-1',
      requestId: 'rid-1',
      isLowdefyError: true,
    },
  });
  expect(JSON.stringify(payload)).not.toContain('secret');
});

test('redactErrorResponse sends the same wire error in dev as in prod', () => {
  const prod = redactErrorResponse({ mode: 'prod', rid: 'rid-1', configDirectory }, createChain());
  const dev = redactErrorResponse({ mode: 'dev', rid: 'rid-1', configDirectory }, createChain());

  expect(dev['~e']).toEqual(prod['~e']);
});

test('redactErrorResponse adds devError with the full error only in dev', () => {
  const payload = redactErrorResponse({ mode: 'dev', rid: 'rid-1' }, createChain());
  const full = payload.devError['~e'];

  expect(full.message).toBe('Request failed.');
  expect(full.requestId).toBe('rid-1');
  expect(full.received).toEqual({ headers: { authorization: 'Bearer super-secret' } });
  expect(full.config).toBe('root.pages[0:home].requests[0:users]');
  expect(typeof full.stack).toBe('string');
  expect(full.cause.message).toBe('connect ECONNREFUSED 10.0.0.5:5432');
  expect(full.cause.received).toEqual({ password: 'root-secret' });
  expect(typeof full.cause.stack).toBe('string');

  expect('devError' in redactErrorResponse({ mode: 'prod', rid: 'rid-1' }, createChain())).toBe(
    false
  );
  expect('devError' in redactErrorResponse({ rid: 'rid-1' }, createChain())).toBe(false);
});

test('redactErrorResponse payload deserializes to the wire error without devError', () => {
  const payload = redactErrorResponse({ mode: 'dev', rid: 'rid-1' }, createChain());

  const error = serializer.deserialize(payload);

  // The reviver replaces the object holding `~e` with its error, so the
  // `devError` beside it never reaches what config reads.
  expect(error).toBeInstanceOf(RequestError);
  expect(error.message).toBe('Something went wrong.');
  expect('devError' in error).toBe(false);
});

test('redactErrorResponse makes devError source config-relative at every node', () => {
  const nested = new ConfigError('Inner failed.');
  nested.source = `${path.resolve(configDirectory, 'endpoints/admin.yaml')}:12`;
  const error = new ConfigError('Outer failed.', { cause: nested });
  error.source = `${path.resolve(configDirectory, 'pages/home.yaml')}:5`;

  const payload = redactErrorResponse({ mode: 'dev', configDirectory }, error);

  expect(payload.devError['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
  expect(payload.devError['~e'].cause.source).toBe(`${path.join('endpoints', 'admin.yaml')}:12`);
  expect(JSON.stringify(payload)).not.toContain(configDirectory);
});

test('redactErrorResponse strips the devError prefix when configDirectory carries a trailing separator', () => {
  const error = new ConfigError('Block type not found.');
  error.source = `${path.resolve(configDirectory, 'pages/home.yaml')}:5`;

  const payload = redactErrorResponse(
    { mode: 'dev', configDirectory: `${configDirectory}${path.sep}` },
    error
  );

  expect(payload.devError['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
});

test('redactErrorResponse strips the devError prefix when configDirectory is a relative path', () => {
  const error = new ConfigError('Block type not found.');
  // resolveConfigLocation built source with path.resolve(configDirectory, filePath),
  // so a relative configDirectory produces the same absolute path.
  error.source = `${path.resolve('some/app', 'pages/home.yaml')}:5`;

  const payload = redactErrorResponse({ mode: 'dev', configDirectory: 'some/app' }, error);

  expect(payload.devError['~e'].source).toBe(`${path.join('pages', 'home.yaml')}:5`);
});

test('redactErrorResponse leaves a devError source that is not under configDirectory unchanged', () => {
  const error = new ConfigError('Block type not found.');
  error.source = `${path.resolve('/elsewhere/pages/home.yaml')}:5`;

  const payload = redactErrorResponse({ mode: 'dev', configDirectory }, error);

  expect(payload.devError['~e'].source).toBe(`${path.resolve('/elsewhere/pages/home.yaml')}:5`);
});

test('redactErrorResponse normalises a devError source with no line number', () => {
  const error = new ConfigError('Block type not found.');
  // resolveConfigLocation returns the bare path when no line number resolved.
  error.source = path.resolve(configDirectory, 'lowdefy.yaml');

  const payload = redactErrorResponse({ mode: 'dev', configDirectory }, error);

  expect(payload.devError['~e'].source).toBe('lowdefy.yaml');
});

test('redactErrorResponse leaves a source value inside author-written UserError data alone', () => {
  const authorSource = path.resolve(configDirectory, 'uploads/report.csv');
  const error = new UserError('Upload rejected.', {
    cause: { source: authorSource },
    metaData: { source: authorSource },
  });
  error.source = `${path.resolve(configDirectory, 'pages/upload.yaml')}:3`;

  const payload = redactErrorResponse({ mode: 'dev', configDirectory }, error);

  // The normalisation keys on the error-node shape, not on the key name, so a
  // `source` the author wrote survives in both the wire error and devError.
  expect(payload['~e'].cause.source).toBe(authorSource);
  expect(payload['~e'].metaData.source).toBe(authorSource);
  expect('source' in payload['~e']).toBe(false);
  expect(payload.devError['~e'].cause.source).toBe(authorSource);
  expect(payload.devError['~e'].source).toBe(`${path.join('pages', 'upload.yaml')}:3`);
});

test('redactErrorResponse passes a null error through unchanged', () => {
  // Endpoint routes serialize the error field on success too, where it is null.
  expect(redactErrorResponse({ mode: 'dev' }, null)).toBeNull();
});

test('redactErrorResponse passes an undefined error through unchanged', () => {
  expect(redactErrorResponse({ mode: 'dev' }, undefined)).toBeUndefined();
});

test('redactErrorResponse sends the wire error when there is no request context', () => {
  // The server error handler can run before the context middleware has.
  const error = new ConfigError('Block type not found.');

  expect(redactErrorResponse(undefined, error)).toEqual({
    '~e': { name: 'ConfigError', message: 'Something went wrong.', isLowdefyError: true },
  });
  expect(redactErrorResponse(null, error)['~e'].message).toBe('Something went wrong.');
});
