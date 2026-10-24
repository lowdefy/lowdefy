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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import collectMobileEndpointRefs from './collectMobileEndpointRefs.js';

// Every API endpoint mobile config names must exist: a shell calls them in the background, where
// a missing endpoint would fail with no page to show it. Runs after buildApi.
function validateMobileEndpointRefs({ components, context }) {
  if (type.isNone(components.mobile)) {
    return components;
  }
  const endpointIds = new Set((components.api ?? []).map((endpoint) => endpoint.endpointId));
  collectMobileEndpointRefs(components.mobile).forEach(({ endpointId, path, configKey }) => {
    if (endpointIds.has(endpointId)) {
      return;
    }
    collectExceptions(
      context,
      new ConfigError(
        `App "${path}" names API endpoint "${endpointId}", which does not exist. Add it to "api".`,
        { configKey }
      )
    );
  });
  return components;
}

export default validateMobileEndpointRefs;
