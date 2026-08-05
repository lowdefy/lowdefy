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

import { AuthenticationError, ConfigError, TwoFactorEnrolmentRequiredError } from '@lowdefy/errors';

import authorizeWebsocket from './authorizeWebsocket.js';

const logger = { debug: () => {} };
const websocketConfig = { websocketId: 'ws', auth: { public: false } };

test('authorizeWebsocket returns without throwing when the outcome is allow', () => {
  const context = { authorizeOutcome: () => 'allow', logger };
  expect(() => authorizeWebsocket(context, { websocketConfig })).not.toThrow();
});

test('authorizeWebsocket throws opaque ConfigError on deny', () => {
  const context = { authorizeOutcome: () => 'deny', logger };
  try {
    authorizeWebsocket(context, { websocketConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    expect(e.message).toBe('Websocket "ws" does not exist.');
    return;
  }
  throw new Error('Expected ConfigError to be thrown');
});

test('authorizeWebsocket throws TwoFactorEnrolmentRequiredError on enrol_required, not AuthenticationError', () => {
  const context = { authorizeOutcome: () => 'enrol_required', logger };
  try {
    authorizeWebsocket(context, { websocketConfig });
  } catch (e) {
    expect(e).toBeInstanceOf(TwoFactorEnrolmentRequiredError);
    expect(e).not.toBeInstanceOf(AuthenticationError);
    expect(e.message).toBe('Two-factor enrolment required for websocket "ws".');
    return;
  }
  throw new Error('Expected TwoFactorEnrolmentRequiredError to be thrown');
});
