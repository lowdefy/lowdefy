/*
  Copyright 2020-2024 Lowdefy, Inc

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

import extractOperatorKey from '../../utils/extractOperatorKey.js';
import traverseConfig from '../../utils/traverseConfig.js';

function validatePayloadReferences({ page, context }) {
  const requests = page.requests || [];

  requests.forEach((request) => {
    // Collect payload keys defined in the request
    const payloadKeys = new Set(Object.keys(request.payload || {}));

    // Skip if no payload defined (nothing to reference)
    if (payloadKeys.size === 0) return;

    // Find _payload references in request.properties
    const payloadRefs = new Map(); // topLevelKey -> configKey (first occurrence)

    traverseConfig({
      config: request.properties,
      visitor: (obj) => {
        if (obj._payload !== undefined) {
          const topLevelKey = extractOperatorKey({ operatorValue: obj._payload });
          if (topLevelKey && !payloadRefs.has(topLevelKey)) {
            payloadRefs.set(topLevelKey, obj['~k']);
          }
        }
      },
    });

    // Warn for undefined payload references
    payloadRefs.forEach((configKey, topLevelKey) => {
      if (payloadKeys.has(topLevelKey)) return;

      const message =
        `_payload references "${topLevelKey}" in request "${request.requestId}" on page "${page.pageId}", ` +
        `but no key "${topLevelKey}" exists in the request payload definition. ` +
        `Payload keys are defined in the request's "payload" property. ` +
        `Check for typos or add the key to the payload definition.`;

      context.logger.configWarning({ message, configKey });
    });
  });
}

export default validatePayloadReferences;
