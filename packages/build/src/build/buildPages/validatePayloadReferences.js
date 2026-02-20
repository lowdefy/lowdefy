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

import { ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import traverseConfig from '../../utils/traverseConfig.js';

function validatePayloadReferences({ page, context }) {
  const requests = page.requests || [];

  requests.forEach((request) => {
    // Collect payload keys defined in the request
    const payloadKeys = Object.keys(request.payload || {});

    // Skip if no payload defined (nothing to reference)
    if (payloadKeys.length === 0) return;

    // Find _payload references in request.properties
    const payloadRefs = new Map(); // dedup key -> { configKey, fullValue }

    traverseConfig({
      config: request.properties,
      visitor: (obj) => {
        if (obj._payload !== undefined) {
          const fullValue = type.isString(obj._payload)
            ? obj._payload
            : type.isObject(obj._payload)
              ? obj._payload.key || obj._payload.path
              : null;

          if (!fullValue) return;

          const dedupKey = fullValue.split(/[.[]/)[0];
          if (!dedupKey || payloadRefs.has(dedupKey)) return;

          payloadRefs.set(dedupKey, { configKey: obj['~k'], fullValue });
        }
      },
    });

    // Warn for undefined payload references
    payloadRefs.forEach(({ configKey, fullValue }, dedupKey) => {
      // Check if the full reference value matches any payload key.
      // A payload key matches if the reference equals it exactly,
      // or accesses a sub-path of it (key followed by '.' or '[').
      // This handles dotted payload keys like "qc_state.chemical_analysis".
      const isValid = payloadKeys.some(
        (key) =>
          fullValue === key ||
          fullValue.startsWith(key + '.') ||
          fullValue.startsWith(key + '[')
      );
      if (isValid) return;

      const message =
        `_payload references "${dedupKey}" in request "${request.requestId}" on page "${page.pageId}", ` +
        `but no key "${dedupKey}" exists in the request payload definition. ` +
        `Payload keys are defined in the request's "payload" property. ` +
        `Check for typos or add the key to the payload definition.`;

      context.handleWarning(
        new ConfigWarning(message, { configKey, prodError: true, checkSlug: 'payload-refs' })
      );
    });
  });
}

export default validatePayloadReferences;
