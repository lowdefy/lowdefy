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
import { type } from '@lowdefy/helpers';

function authorizeRequest({ authorizeOutcome: authorize, logger, user }, { requestConfig }) {
  const outcome = authorize(requestConfig);
  if (outcome !== 'allow') {
    logger.debug({
      event: 'debug_request_authorize',
      authorized: false,
      outcome,
      auth_config: requestConfig.auth,
    });
    if (outcome === 'enrol_required') {
      // Reached only after the role check passed, so the caller is authorised and
      // this reveals nothing about what exists (Decision 6). A distinct code, not
      // a 401 - a 401 reads to the client as a dead session and bounces the user
      // to sign-in, which is the loop by another route.
      throw new TwoFactorEnrolmentRequiredError(
        `Two-factor enrolment required for request "${requestConfig.requestId}".`
      );
    }
    // Unauthenticated on a protected request - 401 tells the caller to fix
    // its credentials. Wrong roles stay opaque below.
    if (type.isNone(user)) {
      throw new AuthenticationError(
        `Authentication required for request "${requestConfig.requestId}".`
      );
    }
    // Throw does not exist error to avoid leaking information that request exists to unauthorized users
    throw new ConfigError(`Request "${requestConfig.requestId}" does not exist.`, {
      configKey: requestConfig['~k'],
    });
  }
  logger.debug({
    event: 'debug_request_authorize',
    authorized: true,
    auth_config: requestConfig.auth,
  });
}

export default authorizeRequest;
