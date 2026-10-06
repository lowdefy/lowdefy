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

import { jest } from '@jest/globals';
import { getDevError } from '@lowdefy/engine';
import {
  AuthenticationError,
  AuthorizationError,
  TwoFactorEnrolmentRequiredError,
  UserError,
} from '@lowdefy/errors';

import request from './request.js';

function mockFetchResponse({ ok, status = ok ? 200 : 500, body }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  delete global.fetch;
});

test('request returns the parsed body of a successful response', async () => {
  mockFetchResponse({ ok: true, body: { value: 1 } });
  await expect(request({ url: '/api/test' })).resolves.toEqual({ value: 1 });
});

test('request throws the decoded wire error for an error payload, with its dev error beside it', async () => {
  mockFetchResponse({
    ok: false,
    body: {
      '~e': { name: 'Error', message: 'Something went wrong.', requestId: 'rid-1' },
      devError: { '~e': { name: 'Error', message: 'Session store unreachable.' } },
    },
  });
  let thrown;
  try {
    await request({ url: '/api/test', method: 'POST', body: {} });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(Error);
  expect(thrown.message).toBe('Something went wrong.');
  expect(thrown.requestId).toBe('rid-1');
  expect(Object.getOwnPropertyNames(thrown)).not.toContain('devError');
  expect(getDevError(thrown).message).toBe('Session store unreachable.');
});

test('request throws the body message for a non-2xx response without an error payload', async () => {
  mockFetchResponse({ ok: false, body: { message: 'Bad gateway.' } });
  await expect(request({ url: '/api/test' })).rejects.toThrow('Bad gateway.');
});

test.each([
  [401, 'AuthenticationError', 'Authentication required for request "save".', AuthenticationError],
  [403, 'AuthorizationError', 'Request "save" does not exist.', AuthorizationError],
  [
    403,
    'TwoFactorEnrolmentRequiredError',
    'Two-factor enrolment required for request "save".',
    TwoFactorEnrolmentRequiredError,
  ],
  [400, 'UserError', 'Payload does not match the endpoint schema.', UserError],
])(
  'request keeps the class of an expected outcome the server answers itself (%i %s)',
  async (status, name, message, ErrorClass) => {
    mockFetchResponse({ ok: false, status, body: { name, message } });
    let thrown;
    try {
      await request({ url: '/api/request/home/save', method: 'POST', body: {} });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ErrorClass);
    expect(thrown.name).toBe(name);
    expect(thrown.message).toBe(message);
    expect(thrown.isLowdefyError).toBe(true);
  }
);

test('request throws a plain Error for a non-2xx body whose name is not an expected outcome', async () => {
  mockFetchResponse({ ok: false, body: { name: 'constructor', message: 'Upstream failed.' } });
  let thrown;
  try {
    await request({ url: '/api/test' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown.name).toBe('Error');
  expect(thrown.message).toBe('Upstream failed.');
  expect(thrown.isLowdefyError).toBeUndefined();
});

describe('build check', () => {
  const originalLocation = window.location;
  const refusal = {
    name: 'UserError',
    message: 'This page is from an earlier version of the app. Reload the page to continue.',
    buildId: 'build-2',
  };

  beforeEach(() => {
    window.sessionStorage.clear();
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  test('request sends the bundle build id in the x-lowdefy-build header', async () => {
    mockFetchResponse({ ok: true, body: {} });
    await request({ buildId: 'build-1', url: '/api/test', method: 'POST', body: {} });
    expect(global.fetch.mock.calls[0][1].headers['x-lowdefy-build']).toBe('build-1');
  });

  test('request sends no x-lowdefy-build header when the bundle has no build id', async () => {
    mockFetchResponse({ ok: true, body: {} });
    await request({ url: '/api/test', method: 'POST', body: {} });
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty('x-lowdefy-build');
  });

  test('request reloads and never settles when the server refuses a call from another build', async () => {
    mockFetchResponse({ ok: false, status: 409, body: refusal });
    const settled = jest.fn();
    request({ buildId: 'build-1', url: '/api/test', method: 'POST', body: {} }).then(
      settled,
      settled
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();
  });

  test('request throws the refusal as a UserError once the tab has already reloaded for that build', async () => {
    window.sessionStorage.setItem('lowdefy.reloadedForBuild', 'build-2');
    mockFetchResponse({ ok: false, status: 409, body: refusal });
    await expect(
      request({ buildId: 'build-1', url: '/api/test', method: 'POST', body: {} })
    ).rejects.toBeInstanceOf(UserError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request does not reload for an error response other than a build refusal', async () => {
    mockFetchResponse({ ok: false, status: 403, body: { ...refusal, name: 'AuthorizationError' } });
    await expect(
      request({ buildId: 'build-1', url: '/api/test', method: 'POST', body: {} })
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
