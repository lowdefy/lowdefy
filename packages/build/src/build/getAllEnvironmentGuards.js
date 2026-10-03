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

import getEnvironmentNames from '../utils/getEnvironmentNames.js';

function withoutMarkers(map) {
  return Object.fromEntries(Object.entries(map ?? {}).filter(([key]) => !key.startsWith('~')));
}

// Every declared environment's guards, one key per environment, with `secrets` and `env` always
// present, so a reader tells an undeclared environment (no key) from one that pins nothing.
function getAllEnvironmentGuards({ environments }) {
  return Object.fromEntries(
    getEnvironmentNames(environments).map((name) => [
      name,
      {
        secrets: withoutMarkers(environments[name]?.guards?.secrets),
        env: withoutMarkers(environments[name]?.guards?.env),
      },
    ])
  );
}

export default getAllEnvironmentGuards;
