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
import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import buildEndpoint from './buildEndpoint.js';

function buildApi({ components, context }) {
  if (components.api && !type.isArray(components.api)) {
    throw new ConfigError({
      message: 'Api is not an array.',
      received: components.api,
      context,
    });
  }
  const api = type.isArray(components.api) ? components.api : [];
  const checkDuplicateEndpointId = createCheckDuplicateId({
    message: 'Duplicate endpointId "{{ id }}".',
    context,
  });

  // Wrap each endpoint build to collect errors instead of stopping on first error
  api.forEach((endpoint, index) => {
    try {
      buildEndpoint({ endpoint, index, context, checkDuplicateEndpointId });
    } catch (error) {
      // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
      if (
        error instanceof ConfigError &&
        shouldSuppressBuildCheck(error, context.keyMap)
      ) {
        return;
      }
      // Collect error object if context.errors exists, otherwise throw (for backward compat with tests)
      if (context?.errors) {
        context.errors.push(error);
      } else {
        throw error;
      }
    }
  });

  return components;
}

export default buildApi;
