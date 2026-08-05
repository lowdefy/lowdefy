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
  ConfigError,
  TwoFactorEnrolmentRequiredError,
} from '@lowdefy/errors';

import authorizeApiEndpoint from './authorizeApiEndpoint.js';

const logger = { debug: () => {} };
const endpointConfig = { endpointId: 'ep', auth: { public: false } };

test('authorizeApiEndpoint returns without throwing when the outcome is allow', () => {
  const context = { authorizeOutcome: () => 'allow', logger, user: { sub: 'sub' } };
  expect(() => authorizeApiEndpoint(context, { endpointConfig })).not.toThrow();
});

test('authorizeApiEndpoint throws AuthenticationError on deny when the caller is unauthenticated', () => {
  const context = { authorizeOutcome: () => 'deny', logger, user: null };
  try {
    authorizeApiEndpoint(context, { endpointConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(AuthenticationError);
    expect(e.message).toBe('Authentication required for API endpoint "ep".');
    return;
  }
  throw new Error('Expected AuthenticationError to be thrown');
});

test('authorizeApiEndpoint throws opaque ConfigError on deny when the caller is authenticated', () => {
  const context = { authorizeOutcome: () => 'deny', logger, user: { sub: 'sub' } };
  try {
    authorizeApiEndpoint(context, { endpointConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('API Endpoint "ep" does not exist.');
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('authorizeApiEndpoint throws TwoFactorEnrolmentRequiredError on enrol_required, not AuthenticationError', () => {
  const context = { authorizeOutcome: () => 'enrol_required', logger, user: { sub: 'sub' } };
  try {
    authorizeApiEndpoint(context, { endpointConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(TwoFactorEnrolmentRequiredError);
    expect(e).not.toBeInstanceOf(AuthenticationError);
    expect(e.message).toBe('Two-factor enrolment required for API Endpoint "ep".');
    return;
  }
  throw new Error('Expected TwoFactorEnrolmentRequiredError to be thrown');
});
