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

function validateDynamicBlockRefs({ dynamicBlockRefs, endpointConfigs, context }) {
  // Both Api and InternalApi endpoints are valid — resolution is an in-process
  // call, so InternalApi is the recommended resolver type.
  const existingEndpointIds = new Set(endpointConfigs.map((config) => config.endpointId));

  dynamicBlockRefs.forEach(({ endpointId, block, sourcePageId }) => {
    if (!existingEndpointIds.has(endpointId)) {
      context.handleWarning(
        new ConfigWarning(
          `Dynamic block "${block.blockId}" on page "${sourcePageId}" references non-existent endpoint "${endpointId}". ` +
            `Check the endpointId for typos, or add an Api endpoint with id "${endpointId}".`,
          { configKey: block['~k'], prodError: true, checkSlug: 'dynamic-endpoint-refs' }
        )
      );
    }
  });
}

export default validateDynamicBlockRefs;
