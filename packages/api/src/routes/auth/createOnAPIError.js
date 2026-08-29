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

import { type } from '@lowdefy/helpers';

// BetterAuth's router logs every APIError at error level when the logger level
// is warn or debug, so a wrong password, an expired link or a stale OAuth
// authorization query produced an ERROR line in the server log on every
// attempt. Supplying onAPIError.onError replaces that logging - the router
// returns right after calling it and the HTTP response is unaffected.
//
// A 4xx is the auth server rejecting the caller's attempt: expected traffic,
// one warn line, the same treatment the server error handler gives an
// AuthenticationError. Anything else is a fault in the auth engine or its
// adapter and stays at error level with the error object, so the cause chain
// and stack are logged.
function createOnAPIError({ logger }) {
  return function onAPIError(error) {
    const statusCode = error?.statusCode;
    if (type.isInt(statusCode) && statusCode >= 400 && statusCode < 500) {
      logger.warn(
        { event: 'auth_engine', code: error.body?.code, status: statusCode },
        `Auth request rejected (${statusCode}): ${error.message}`
      );
      return;
    }
    logger.error(error);
  };
}

export default createOnAPIError;
