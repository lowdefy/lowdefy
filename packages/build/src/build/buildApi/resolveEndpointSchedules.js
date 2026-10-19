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

import getEnvironmentNames from '../../utils/getEnvironmentNames.js';

// With config.environments declared, the artifact carries `schedules` as an object with one
// explicit list per declared environment: the environment's own entry when the author keyed the
// schedules by environment, else the `default` entry, else nothing (`[]` turns the crons off). An
// array applies as-is to every environment. `default` is kept too, for a build with no current
// environment. The runtime and the schedules manifest then read `schedules.<environment>` without
// repeating the inheritance. Without config.environments the endpoint keeps its array.
function resolveEndpointSchedules({ endpoint, environments }) {
  const names = getEnvironmentNames(environments);
  if (names.length === 0 || type.isUndefined(endpoint.schedules)) return;
  const authored = endpoint.schedules;
  const inherited = type.isArray(authored) ? authored : authored.default ?? [];
  const resolved = { default: inherited };
  names.forEach((name) => {
    if (type.isArray(authored)) {
      resolved[name] = authored;
      return;
    }
    resolved[name] = authored[name] ?? inherited;
  });
  endpoint.schedules = resolved;
}

export default resolveEndpointSchedules;
