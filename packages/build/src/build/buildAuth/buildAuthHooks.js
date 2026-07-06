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

import authHookPoints from './authHookPoints.js';

// Validates the auth.hooks bindings. Each entry binds an auth lifecycle point
// to an InternalApi endpoint's routine. Any number of hooks may bind one
// point, and one endpoint may bind several points - the runtime composes all
// bindings for a point in array order. Runs over the merged array (module
// contributions first, then app entries) and before buildApi, so endpoints
// still carry their raw id and declared type.
function buildAuthHooks({ components }) {
  const seenIds = {};
  (components.auth.hooks ?? []).forEach((hook) => {
    const configKey = hook['~k'];
    if (seenIds[hook.id] === true) {
      throw new ConfigError(`Duplicate auth hook id "${hook.id}".`, { configKey });
    }
    seenIds[hook.id] = true;
    if (!authHookPoints.includes(hook.point)) {
      throw new ConfigError(
        `Auth hook "${hook.id}" binds unknown point "${
          hook.point
        }". Valid points are: ${authHookPoints.join(', ')}.`,
        { received: hook.point, configKey }
      );
    }

    const endpoint = (components.api ?? []).find((e) => e.id === hook.endpointId);
    if (type.isNone(endpoint)) {
      throw new ConfigError(
        `Auth hook "${hook.id}" references endpoint "${hook.endpointId}" which does not exist.`,
        { configKey }
      );
    }
    if (endpoint.type !== 'InternalApi') {
      throw new ConfigError(
        `Auth hook "${hook.id}" endpoint "${hook.endpointId}" must be type "InternalApi" so it is not callable over HTTP.`,
        { received: endpoint.type, configKey }
      );
    }
  });
  return components;
}

export default buildAuthHooks;
