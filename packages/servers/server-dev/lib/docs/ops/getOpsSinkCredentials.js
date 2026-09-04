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

const REQUIRED_ENV = ['LOWDEFY_OPS_QUERY_URL', 'LOWDEFY_OPS_READ_TOKEN', 'LOWDEFY_OPS_DATASET'];

// The sink credentials, read fresh: an operator who exports them into an
// already-running dev shell should not have to restart the server, and the
// MCP manifest never changes either way because the tools are always
// registered.
//
// Returns { url, token, dataset } when all three are set, otherwise the names
// that are missing.
function getOpsSinkCredentials() {
  const missing = REQUIRED_ENV.filter(
    (name) => type.isNone(process.env[name]) || process.env[name] === ''
  );
  if (missing.length > 0) {
    return { missing };
  }
  return {
    missing: [],
    url: process.env.LOWDEFY_OPS_QUERY_URL,
    token: process.env.LOWDEFY_OPS_READ_TOKEN,
    dataset: process.env.LOWDEFY_OPS_DATASET,
  };
}

export { REQUIRED_ENV };
export default getOpsSinkCredentials;
