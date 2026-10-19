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

import {
  AuthenticationError,
  AuthorizationError,
  TwoFactorEnrolmentRequiredError,
} from '@lowdefy/errors';

import authorizeRequest from './authorizeRequest.js';
import createAuthorizeOutcome from '../../context/createAuthorizeOutcome.js';

const logger = { debug: () => {} };
const requestConfig = { requestId: 'req', auth: { public: false }, '~k': 'requests[0].auth' };

test('authorizeRequest returns without throwing when the outcome is allow', () => {
  const context = { authorizeOutcome: () => 'allow', logger, user: { sub: 'sub' } };
  expect(() => authorizeRequest(context, { requestConfig })).not.toThrow();
});

test('authorizeRequest throws AuthenticationError on deny when the caller is unauthenticated', () => {
  const context = { authorizeOutcome: () => 'deny', logger, user: null };
  try {
    authorizeRequest(context, { requestConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(AuthenticationError);
    expect(e.message).toBe('Authentication required for request "req".');
    return;
  }
  throw new Error('Expected AuthenticationError to be thrown');
});

test('authorizeRequest throws opaque AuthorizationError on deny when the caller is authenticated', () => {
  const context = { authorizeOutcome: () => 'deny', logger, user: { sub: 'sub' } };
  try {
    authorizeRequest(context, { requestConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(AuthorizationError);
    expect(e.message).toBe('Request "req" does not exist.');
    return;
  }
  throw new Error('Expected AuthorizationError to be thrown');
});

test('authorizeRequest throws TwoFactorEnrolmentRequiredError on enrol_required, not AuthenticationError', () => {
  const context = { authorizeOutcome: () => 'enrol_required', logger, user: { sub: 'sub' } };
  try {
    authorizeRequest(context, { requestConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(TwoFactorEnrolmentRequiredError);
    expect(e).not.toBeInstanceOf(AuthenticationError);
    expect(e.message).toBe('Two-factor enrolment required for request "req".');
    return;
  }
  throw new Error('Expected TwoFactorEnrolmentRequiredError to be thrown');
});

test('forwards context.pageId so an enrol-page request is exempted and other pages are not', () => {
  // Wires the real createAuthorizeOutcome so this exercises the pageId forwarding
  // in authorizeRequest together with the enrol-page exemption it feeds. An
  // unenrolled caller running a request registered on the enrol page inherits
  // the page's exemption; the same caller on any other page hits the floor.
  const enforcement = { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' };
  const user = { sub: 'sub', two_factor_enrolled: false };
  const authorizeOutcome = createAuthorizeOutcome({ authEnforcement: enforcement, user });

  expect(() =>
    authorizeRequest({ authorizeOutcome, logger, pageId: 'enrol', user }, { requestConfig })
  ).not.toThrow();

  expect(() =>
    authorizeRequest({ authorizeOutcome, logger, pageId: 'other', user }, { requestConfig })
  ).toThrow(TwoFactorEnrolmentRequiredError);
});
