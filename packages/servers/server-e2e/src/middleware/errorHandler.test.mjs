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
import { HTTPException } from 'hono/http-exception';
import { jest } from '@jest/globals';

import createErrorHandler from './errorHandler.js';

// The handler here is byte-identical to its `server-e2e` counterpart (and to
// `server`'s apart from the Sentry capture, which `server` tests separately).
// Keep the three in sync when changing any of them.

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

function createAuthenticationError(message) {
  const error = new Error(message);
  error.name = 'AuthenticationError';
  error.received = SECRET;
  return error;
}

function createAuthorizationError(message) {
  const error = new Error(message);
  error.name = 'AuthorizationError';
  error.received = SECRET;
  return error;
}

function createTwoFactorEnrolmentRequiredError(message) {
  const error = new Error(message);
  error.name = 'TwoFactorEnrolmentRequiredError';
  error.received = SECRET;
  return error;
}

function createUserError(message) {
  const error = new Error(message);
  error.name = 'UserError';
  error.received = SECRET;
  return error;
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

test('errorHandler returns 401 with only name and message for an AuthenticationError on an api path', async () => {
  const logger = createLogger();
  const context = { handleError: jest.fn() };
  const res = await createApp({
    context,
    error: createAuthenticationError('Unauthenticated.'),
    logger,
  }).request('/api/request/getUsers');

  expect(res.status).toEqual(401);
  expect(await res.json()).toEqual({ name: 'AuthenticationError', message: 'Unauthenticated.' });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toMatch(/Unauthenticated request/);
  expect(logger.error).not.toHaveBeenCalled();
  expect(context.handleError).not.toHaveBeenCalled();
});

test('errorHandler does not send an AuthenticationError through the redactor', async () => {
  const res = await createApp({
    error: createAuthenticationError('Unauthenticated.'),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e']).toBeUndefined();
});

test('errorHandler returns text Unauthorized at 401 for an AuthenticationError on a page path', async () => {
  const logger = createLogger();
  const res = await createApp({
    error: createAuthenticationError('Unauthenticated.'),
    logger,
  }).request('/home');

  expect(res.status).toEqual(401);
  expect(await res.text()).toEqual('Unauthorized');
  expect(logger.warn).toHaveBeenCalledTimes(1);
});

test('errorHandler returns 403 with only name and message for an AuthorizationError on an api path', async () => {
  const logger = createLogger();
  const context = { handleError: jest.fn() };
  const res = await createApp({
    context,
    error: createAuthorizationError('Forbidden.'),
    logger,
  }).request('/api/request/getUsers');

  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({ name: 'AuthorizationError', message: 'Forbidden.' });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toMatch(/Forbidden: GET \/api\/request\/getUsers/);
  expect(logger.error).not.toHaveBeenCalled();
  expect(context.handleError).not.toHaveBeenCalled();
});

test('errorHandler does not send an AuthorizationError through the redactor', async () => {
  const res = await createApp({
    error: createAuthorizationError('Forbidden.'),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e']).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(SECRET);
});

test('errorHandler returns text Forbidden at 403 for an AuthorizationError on a page path', async () => {
  const logger = createLogger();
  const res = await createApp({
    error: createAuthorizationError('Forbidden.'),
    logger,
  }).request('/home');

  expect(res.status).toEqual(403);
  expect(await res.text()).toEqual('Forbidden');
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.error).not.toHaveBeenCalled();
});

test('errorHandler returns 403 with only name and message for a TwoFactorEnrolmentRequiredError on an api path', async () => {
  const logger = createLogger();
  const context = { handleError: jest.fn() };
  const res = await createApp({
    context,
    error: createTwoFactorEnrolmentRequiredError('Two-factor enrolment required.'),
    logger,
  }).request('/api/request/getUsers');

  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    name: 'TwoFactorEnrolmentRequiredError',
    message: 'Two-factor enrolment required.',
  });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toMatch(/Two-factor enrolment required/);
  expect(logger.error).not.toHaveBeenCalled();
  expect(context.handleError).not.toHaveBeenCalled();
});

test('errorHandler does not send a TwoFactorEnrolmentRequiredError through the redactor', async () => {
  const res = await createApp({
    error: createTwoFactorEnrolmentRequiredError('Two-factor enrolment required.'),
    logger: createLogger(),
  }).request('/api/request/getUsers');

  const body = await res.json();
  expect(body['~e']).toBeUndefined();
});

test('errorHandler returns text at 403 for a TwoFactorEnrolmentRequiredError on a page path', async () => {
  const logger = createLogger();
  const context = { handleError: jest.fn() };
  const res = await createApp({
    context,
    error: createTwoFactorEnrolmentRequiredError('Two-factor enrolment required.'),
    logger,
  }).request('/home');

  expect(res.status).toEqual(403);
  expect(await res.text()).toEqual('Two-factor enrolment required');
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(context.handleError).not.toHaveBeenCalled();
});

test('errorHandler returns 400 with only name and message for a UserError on an api path', async () => {
  const logger = createLogger();
  const context = { handleError: jest.fn() };
  const res = await createApp({
    context,
    error: createUserError('Payload for endpoint "x" does not match its payloadSchema.'),
    logger,
  }).request('/api/endpoints/x', { method: 'POST' });

  expect(res.status).toEqual(400);
  expect(await res.json()).toEqual({
    name: 'UserError',
    message: 'Payload for endpoint "x" does not match its payloadSchema.',
  });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toMatch(/Bad request: POST \/api\/endpoints\/x/);
  expect(logger.error).not.toHaveBeenCalled();
  expect(context.handleError).not.toHaveBeenCalled();
});

test('errorHandler does not send a UserError through the redactor', async () => {
  const res = await createApp({
    error: createUserError('Bad payload.'),
    logger: createLogger(),
  }).request('/api/endpoints/x');

  const body = await res.json();
  expect(body['~e']).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(SECRET);
});

test('errorHandler returns text Bad Request at 400 for a UserError on a page path', async () => {
  const logger = createLogger();
  const res = await createApp({
    error: createUserError('Bad payload.'),
    logger,
  }).request('/home');

  expect(res.status).toEqual(400);
  expect(await res.text()).toEqual('Bad Request');
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.error).not.toHaveBeenCalled();
});

test('errorHandler sends an HTTPException response as-is with one warning and no error log', async () => {
  const logger = createLogger();
  const error = new HTTPException(404, {
    res: Response.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Unsupported protocol version' } },
      { status: 404 }
    ),
  });
  const res = await createApp({ error, logger }).request('/api/mcp', { method: 'POST' });
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Unsupported protocol version' },
  });
  expect(logger.warn).toHaveBeenCalledWith('404 answered by the route: POST /api/mcp');
  expect(logger.error).not.toHaveBeenCalled();
});

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
