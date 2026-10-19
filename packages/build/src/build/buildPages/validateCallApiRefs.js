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

function validateCallApiRefs({ callApiActionRefs, endpointConfigs, context }) {
  const existingEndpointIds = new Set(endpointConfigs.map((config) => config.endpointId));
  const internalEndpoints = new Set(
    endpointConfigs
      .filter((config) => config.type === 'InternalApi')
      .map((config) => config.endpointId)
  );

  callApiActionRefs.forEach(({ endpointId, action, sourcePageId }) => {
    if (action.skip === true) {
      return;
    }

    if (!existingEndpointIds.has(endpointId)) {
      context.handleWarning(
        new ConfigWarning(
          `CallAPI action on page "${sourcePageId}" references non-existent endpoint "${endpointId}". ` +
            `Check the endpointId for typos, or add an Api endpoint with id "${endpointId}".`,
          { configKey: action['~k'], prodError: true, checkSlug: 'callapi-refs' }
        )
      );
      return;
    }

    if (internalEndpoints.has(endpointId)) {
      context.handleWarning(
        new ConfigWarning(
          `CallAPI action on page "${sourcePageId}" targets InternalApi endpoint "${endpointId}". ` +
            `InternalApi endpoints are not accessible from client pages. ` +
            `Change the endpoint type to Api, or call it from another endpoint using a :call_api step.`,
          { configKey: action['~k'], prodError: true, checkSlug: 'callapi-internal-refs' }
        )
      );
    }
  });
}

export default validateCallApiRefs;
