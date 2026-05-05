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

import { ConfigError } from '@lowdefy/errors';
import extractInitiator from '../../audit/extractInitiator.js';

function authorizeRequest(context, { requestConfig }) {
  const { authorize, logger } = context;
  if (!authorize(requestConfig)) {
    logger.debug({
      event: 'debug_request_authorize',
      authorized: false,
      auth_config: requestConfig.auth,
    });
    context.audit?.log({
      category: 'authorization',
      eventType: 'authz.denied',
      severity: 'high',
      initiator: extractInitiator(context),
      target: {
        type: 'request',
        id: requestConfig.requestId,
        pageId: context.pageId,
      },
      action: 'authorize',
      outcome: 'denied',
      rid: context.rid,
    });
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
