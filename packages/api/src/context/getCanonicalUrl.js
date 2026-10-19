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

import getCurrentEnvironment from './getCurrentEnvironment.js';

// The deployment's pinned canonical origin: BETTER_AUTH_URL when set, else the url of the current
// environment in config.environments. Both come from deployment config, never from a request's
// Host header, so auth links and the MCP resource identifier cannot be steered by a caller. Null
// when neither is set.
function getCanonicalUrl({ config }) {
  const fromEnv = process.env.BETTER_AUTH_URL?.trim();
  if (fromEnv) return fromEnv;
  return getCurrentEnvironment({ config })?.url ?? null;
}

export default getCanonicalUrl;
