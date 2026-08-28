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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

import createErrorHandler from './errorHandler.js';

// This is the only test coverage of the hono 500 redaction path: the file here is
// byte-identical to its `server` and `server-e2e` counterparts, and `server` has no
// test script at all. Keep the three in sync when changing any of them.

// A string that must never reach a client. It is put on `received` at every
// level of the cause chain, so a single JSON.stringify search over the body
// proves the redaction reached that level.
const SECRET = 'SECRET-RECEIVED-VALUE';

function createLogger() {
  return { error: jest.fn(), warn: jest.fn() };
}

// The error handler is only reachable through hono's app-level onError, so the
// handler is driven the way production drives it: a route that throws, with the
// lowdefyContext set by upstream middleware when there is one.
function createApp({ basePath = '', context, error, logger }) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    if (context) c.set('lowdefyContext', context);
    await next();
  });
  app.all('*', () => {
    throw error;
  });
  app.onError(createErrorHandler({ basePath, logger }));
  return app;
}

// Two Error levels, each with a stack (every Error has one) and a recognisable
// `received`, plus a configKey the policy keeps.
function createErrorWithCause() {
  const cause = new Error('Cause message.');
  cause.received = `${SECRET}-cause`;
  const error = new Error('Top message.', { cause });
  error.received = `${SECRET}-top`;
  error.configKey = 'page:home.blocks.0';
  return error;
}

test('errorHandler returns 500 with the serialized error envelope on an api path', async () => {
  const res = await createApp({
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  expect(res.status).toEqual(500);
  const body = await res.json();
  expect(body['~e'].name).toEqual('Error');
  expect(body['~e'].message).toEqual('Top message.');
  expect(body['~e'].cause.message).toEqual('Cause message.');
});

test('errorHandler omits stack and received from the 500 envelope at the top level', async () => {
  const res = await createApp({
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e'].stack).toBeUndefined();
  expect(body['~e'].received).toBeUndefined();
});

// The regression test for the real bug: the four inline `delete` statements this
// replaces only ever reached depth 0, so a `received` or `stack` on the cause
// still crossed the wire. The policy is now applied at every error node.
test('errorHandler omits stack and received from the 500 envelope on the cause at depth 1', async () => {
  const res = await createApp({
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e'].cause.stack).toBeUndefined();
  expect(body['~e'].cause.received).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(SECRET);
});

test('errorHandler keeps configKey on the 500 envelope so the fault can be located in config', async () => {
  const res = await createApp({
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e'].configKey).toEqual('page:home.blocks.0');
});

test('errorHandler returns text Internal Server Error at 500 on a page path with no payload', async () => {
  const res = await createApp({
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/home');

  expect(res.status).toEqual(500);
  expect(await res.text()).toEqual('Internal Server Error');
});

test('errorHandler awaits context.handleError before serializing the response', async () => {
  const context = {
    handleError: jest.fn(async (error) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      error.awaited = true;
    }),
  };
  const error = createErrorWithCause();
  const res = await createApp({ context, error, logger: createLogger() }).request(
    '/api/request/getUsers'
  );

  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(context.handleError).toHaveBeenCalledWith(error);
  const body = await res.json();
  expect(body['~e'].awaited).toBe(true);
});

// createHandleError sets error.handled once it has logged. The client reads it
// to decide whether to POST the error back for logging, so it has to survive
// serialization or the error is logged a second time.
test('errorHandler returns handled true on the 500 envelope after handleError sets it', async () => {
  const context = {
    handleError: jest.fn(async (error) => {
      error.handled = true;
    }),
  };
  const res = await createApp({
    context,
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e'].handled).toBe(true);
});

test('errorHandler logs with logger.error when the request has no lowdefyContext', async () => {
  const logger = createLogger();
  const error = createErrorWithCause();
  const res = await createApp({ error, logger }).request('/api/request/getUsers');

  expect(res.status).toEqual(500);
  expect(logger.error).toHaveBeenCalledTimes(1);
  expect(logger.error).toHaveBeenCalledWith(error);
});

test('errorHandler treats a basePath prefixed api path as an api path', async () => {
  const res = await createApp({
    basePath: '/base',
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/base/api/request/getUsers');

  expect(res.status).toEqual(500);
  const body = await res.json();
  expect(body['~e'].message).toEqual('Top message.');
});

test('errorHandler treats a basePath prefixed page path as a page path', async () => {
  const res = await createApp({
    basePath: '/base',
    error: createErrorWithCause(),
    logger: createLogger(),
  }).request('/base/home');

  expect(res.status).toEqual(500);
  expect(await res.text()).toEqual('Internal Server Error');
});
