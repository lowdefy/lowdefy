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

import { ConfigError, TwoFactorEnrolmentRequiredError } from '@lowdefy/errors';

function authorizeWebsocket({ authorizeOutcome: authorize, logger }, { websocketConfig }) {
  const outcome = authorize(websocketConfig);
  if (outcome !== 'allow') {
    logger.debug({
      event: 'debug_websocket_authorize',
      authorized: false,
      outcome,
      auth_config: websocketConfig.auth,
    });
    if (outcome === 'enrol_required') {
      // Reached only after the role check passed, so the caller is authorised and
      // this reveals nothing about what exists (Decision 6). A distinct code, not
      // a 401 - a 401 reads to the client as a dead session and bounces the user
      // to sign-in, which is the loop by another route.
      throw new TwoFactorEnrolmentRequiredError(
        `Two-factor enrolment required for websocket "${websocketConfig.websocketId}".`
      );
    }
    // Same message as a missing websocket so channel existence does not leak.
    throw new ConfigError(`Websocket "${websocketConfig.websocketId}" does not exist.`);
  }
}

export default authorizeWebsocket;
