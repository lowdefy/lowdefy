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

import { AuthenticationError, AuthorizationError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function authorizeWebsocket({ authorize, logger, user }, { websocketConfig }) {
  if (!authorize(websocketConfig)) {
    logger.debug({
      event: 'debug_websocket_authorize',
      authorized: false,
      auth_config: websocketConfig.auth,
    });
    // Unauthenticated on a protected websocket - 401 tells the caller to fix
    // its credentials. Wrong roles stay opaque below.
    if (type.isNone(user)) {
      throw new AuthenticationError(
        `Authentication required for websocket "${websocketConfig.websocketId}".`
      );
    }
    // Same message as a missing websocket so channel existence does not leak.
    throw new AuthorizationError(`Websocket "${websocketConfig.websocketId}" does not exist.`);
  }
}

export default authorizeWebsocket;
