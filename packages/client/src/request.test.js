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
import { callerHash, callerStamp } from '@lowdefy/helpers';

import request from './request.js';

// The page's lowdefy object: the caller it renders and where it keeps the last
// caller stamp.
function createLowdefy(user) {
  return { _internal: {}, user };
}

function mockFetchResponse({ ok, status = ok ? 200 : 500, body, headers = {} }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      headers: { get: (name) => headers[name] ?? null },
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  delete global.fetch;
});

test('request returns the parsed body of a successful response', async () => {
  mockFetchResponse({ ok: true, body: { value: 1 } });
  await expect(request({ lowdefy: createLowdefy(null), url: '/api/test' })).resolves.toEqual({
    value: 1,
  });
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
    await request({ lowdefy: createLowdefy(null), url: '/api/test', method: 'POST', body: {} });
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
  await expect(request({ lowdefy: createLowdefy(null), url: '/api/test' })).rejects.toThrow(
    'Bad gateway.'
  );
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
      await request({
        lowdefy: createLowdefy(null),
        url: '/api/request/home/save',
        method: 'POST',
        body: {},
      });
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
    await request({ lowdefy: createLowdefy(null), url: '/api/test' });
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
    await request({
      lowdefy: createLowdefy(null),
      buildId: 'build-1',
      url: '/api/test',
      method: 'POST',
      body: {},
    });
    expect(global.fetch.mock.calls[0][1].headers['x-lowdefy-build']).toBe('build-1');
  });

  test('request sends no x-lowdefy-build header when the bundle has no build id', async () => {
    mockFetchResponse({ ok: true, body: {} });
    await request({ lowdefy: createLowdefy(null), url: '/api/test', method: 'POST', body: {} });
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty('x-lowdefy-build');
  });

  test('request reloads and never settles when the server refuses a call from another build', async () => {
    mockFetchResponse({ ok: false, status: 409, body: refusal });
    const settled = jest.fn();
    request({
      lowdefy: createLowdefy(null),
      buildId: 'build-1',
      url: '/api/test',
      method: 'POST',
      body: {},
    }).then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();
  });

  test('request leaves other in-flight requests unsettled when a build refusal reloads the page', async () => {
    const lowdefy = createLowdefy(null);
    let cancelOther;
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            cancelOther = () => reject(new TypeError('Failed to fetch'));
          })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          headers: { get: () => null },
          json: () => Promise.resolve(refusal),
        })
      );
    const settled = jest.fn();
    const args = { lowdefy, buildId: 'build-1', url: '/api/test', method: 'POST', body: {} };
    request(args).then(settled, settled);
    request(args).then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(lowdefy.unloading).toBe(true);
    cancelOther();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();
  });

  test('request throws the refusal as a UserError once the tab has already reloaded for that build', async () => {
    window.sessionStorage.setItem('lowdefy.reloadedForBuild', 'build-2');
    mockFetchResponse({ ok: false, status: 409, body: refusal });
    await expect(
      request({
        lowdefy: createLowdefy(null),
        buildId: 'build-1',
        url: '/api/test',
        method: 'POST',
        body: {},
      })
    ).rejects.toBeInstanceOf(UserError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request does not reload for an error response other than a build refusal', async () => {
    mockFetchResponse({ ok: false, status: 403, body: { ...refusal, name: 'AuthorizationError' } });
    await expect(
      request({
        lowdefy: createLowdefy(null),
        buildId: 'build-1',
        url: '/api/test',
        method: 'POST',
        body: {},
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});

describe('caller check', () => {
  const originalLocation = window.location;
  const userA = { id: 'user_a', organization_id: 'org_1', roles: ['editor'] };

  beforeEach(() => {
    window.sessionStorage.clear();
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  async function expectReloadWithoutSettling(args) {
    const settled = jest.fn();
    request(args).then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();
  }

  test('request returns the response when the server answered as the rendered caller', async () => {
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: { 'x-lowdefy-caller': callerHash({ user: userA }) },
    });
    await expect(
      request({ url: '/api/request/p/r', lowdefy: createLowdefy(userA) })
    ).resolves.toEqual({ value: 1 });
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request reloads when the server answered as another person', async () => {
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: {
        'x-lowdefy-caller': callerHash({ user: { id: 'user_b', organization_id: 'org_1' } }),
      },
    });
    await expectReloadWithoutSettling({ url: '/api/request/p/r', lowdefy: createLowdefy(userA) });
  });

  test('request reloads when the server answered in another organization', async () => {
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: {
        'x-lowdefy-caller': callerHash({ user: { id: 'user_a', organization_id: 'org_2' } }),
      },
    });
    await expectReloadWithoutSettling({ url: '/api/request/p/r', lowdefy: createLowdefy(userA) });
  });

  test('request does not reload on an anonymous page whose caller stays anonymous', async () => {
    mockFetchResponse({ ok: true, body: { value: 1 }, headers: { 'x-lowdefy-caller': '' } });
    await expect(
      request({ url: '/api/request/p/r', lowdefy: createLowdefy(null) })
    ).resolves.toEqual({ value: 1 });
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request throws an AuthenticationError on a second difference within the reload interval', async () => {
    window.sessionStorage.setItem('lowdefy.reloadedForCaller', String(Date.now()));
    mockFetchResponse({ ok: true, body: { value: 1 }, headers: { 'x-lowdefy-caller': '' } });
    await expect(
      request({ url: '/api/request/p/r', lowdefy: createLowdefy(userA) })
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request reloads on a 401 while the page renders a user', async () => {
    mockFetchResponse({
      ok: false,
      status: 401,
      body: { name: 'AuthenticationError', message: 'Authentication required.' },
    });
    await expectReloadWithoutSettling({ url: '/api/endpoints/e', lowdefy: createLowdefy(userA) });
  });

  test('request throws a 401 as today when the page renders no user', async () => {
    mockFetchResponse({
      ok: false,
      status: 401,
      body: { name: 'AuthenticationError', message: 'Authentication required.' },
      headers: { 'x-lowdefy-caller': '' },
    });
    await expect(
      request({ url: '/api/request/p/r', lowdefy: createLowdefy(null) })
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request reloads on a request 403 and throws an endpoint 403', async () => {
    const body = { name: 'AuthorizationError', message: 'Request "r" does not exist.' };
    const headers = { 'x-lowdefy-caller': callerHash({ user: userA }) };
    mockFetchResponse({ ok: false, status: 403, body, headers });
    await expectReloadWithoutSettling({
      url: '/api/request/p/r',
      reloadOnAuthorizationError: true,
      lowdefy: createLowdefy(userA),
    });
    window.sessionStorage.clear();
    window.location.reload.mockClear();
    mockFetchResponse({ ok: false, status: 403, body, headers });
    await expect(
      request({
        url: '/api/endpoints/e',
        reloadOnAuthorizationError: false,
        lowdefy: createLowdefy(userA),
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request never reloads on a two-factor enrolment refusal', async () => {
    mockFetchResponse({
      ok: false,
      status: 403,
      body: { name: 'TwoFactorEnrolmentRequiredError', message: 'Enrol a second factor.' },
      headers: { 'x-lowdefy-caller': callerHash({ user: userA }) },
    });
    await expect(
      request({
        url: '/api/request/p/r',
        reloadOnAuthorizationError: true,
        lowdefy: createLowdefy(userA),
      })
    ).rejects.toBeInstanceOf(TwoFactorEnrolmentRequiredError);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request keeps the stamp of a response answered as the rendered caller', async () => {
    // The fixed vector callerStamp's own tests pin, so server and client agree.
    const user = { id: 'user_1', organization_id: 'org_1', roles: ['admin', 'editor'] };
    const lowdefy = createLowdefy(user);
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: {
        'x-lowdefy-caller':
          '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d',
      },
    });
    await expect(request({ url: '/api/request/p/r', lowdefy })).resolves.toEqual({ value: 1 });
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(lowdefy._internal.callerStamp).toEqual({
      caller: '82e92667feb5824d',
      session: '3a1d7b6848ba4816',
      roles: '228d50a09b1b1e2b',
      memberships: '476954726056d64d',
    });
  });

  test('request reloads when the server answered the rendered caller with other roles', async () => {
    const lowdefy = createLowdefy(userA);
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: { 'x-lowdefy-caller': callerStamp({ user: { ...userA, roles: ['admin'] } }) },
    });
    await expectReloadWithoutSettling({ url: '/api/request/p/r', lowdefy });
    expect(lowdefy._internal.callerStamp).toBeUndefined();
  });

  test('request throws an AuthenticationError on a second roles difference within the reload interval', async () => {
    window.sessionStorage.setItem('lowdefy.reloadedForCaller', String(Date.now()));
    mockFetchResponse({
      ok: true,
      body: { value: 1 },
      headers: { 'x-lowdefy-caller': callerStamp({ user: { ...userA, roles: [] } }) },
    });
    await expect(
      request({ url: '/api/request/p/r', lowdefy: createLowdefy(userA) })
    ).rejects.toThrow('The server answered with different roles than this page shows.');
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('request does not reload when only the session or memberships changed, and keeps the new stamp', async () => {
    const lowdefy = createLowdefy(userA);
    const first = callerStamp({
      user: userA,
      authSession: { id: 'session_1', memberOrganizationIds: ['org_1'] },
    });
    const second = callerStamp({
      user: userA,
      authSession: { id: 'session_2', memberOrganizationIds: ['org_1', 'org_2'] },
    });
    mockFetchResponse({ ok: true, body: { value: 1 }, headers: { 'x-lowdefy-caller': first } });
    await request({ url: '/api/request/p/r', lowdefy });
    const firstStamp = lowdefy._internal.callerStamp;
    mockFetchResponse({ ok: true, body: { value: 2 }, headers: { 'x-lowdefy-caller': second } });
    await expect(request({ url: '/api/request/p/r', lowdefy })).resolves.toEqual({ value: 2 });
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(lowdefy._internal.callerStamp.caller).toBe(firstStamp.caller);
    expect(lowdefy._internal.callerStamp.roles).toBe(firstStamp.roles);
    expect(lowdefy._internal.callerStamp.session).not.toBe(firstStamp.session);
    expect(lowdefy._internal.callerStamp.memberships).not.toBe(firstStamp.memberships);
  });

  test('request keeps the last stamp when a response carries no caller header', async () => {
    const lowdefy = createLowdefy(userA);
    const stamp = { caller: 'kept', session: null, roles: null, memberships: null };
    lowdefy._internal.callerStamp = stamp;
    mockFetchResponse({ ok: true, body: { value: 1 } });
    await request({ url: '/api/request/p/r', lowdefy });
    expect(lowdefy._internal.callerStamp).toBe(stamp);
  });

  test('request keeps an anonymous stamp on an anonymous page', async () => {
    const lowdefy = createLowdefy(null);
    mockFetchResponse({ ok: true, body: { value: 1 }, headers: { 'x-lowdefy-caller': '' } });
    await request({ url: '/api/request/p/r', lowdefy });
    expect(lowdefy._internal.callerStamp).toEqual({
      caller: '',
      session: null,
      roles: null,
      memberships: null,
    });
  });
});

describe('page unload', () => {
  function createUnloadingLowdefy(unloading) {
    return { ...createLowdefy(null), unloading };
  }

  test('request never settles when the browser cancels its fetch as the page unloads', async () => {
    global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const settled = jest.fn();
    request({ lowdefy: createUnloadingLowdefy(true), url: '/api/test' }).then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();
  });

  test('request never settles when the browser cancels the body read as the page unloads', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () => Promise.reject(new TypeError('Load failed')),
      })
    );
    const settled = jest.fn();
    request({ lowdefy: createUnloadingLowdefy(true), url: '/api/test' }).then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();
  });

  test('request throws a network failure while the page stays open', async () => {
    global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(
      request({ lowdefy: createUnloadingLowdefy(false), url: '/api/test' })
    ).rejects.toThrow('Failed to fetch');
  });

  test('request still throws a server error response while the page unloads', async () => {
    mockFetchResponse({ ok: false, body: { message: 'Bad gateway.' } });
    await expect(
      request({ lowdefy: createUnloadingLowdefy(true), url: '/api/test' })
    ).rejects.toThrow('Bad gateway.');
  });
});
