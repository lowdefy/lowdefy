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

// The connection's own filter wins over the current environment's delivery filter
// (config.environments.<env>.email.filter) when it sets at least one field. `false` turns
// filtering off, the environment's too — for mail that must reach the real recipient in every
// environment. An unset connection filter, or one whose fields all resolve to null (a
// `_secret` that is not set on this deployment, say), falls back to the environment's, so a
// missing value can never switch the safety net off.
function setsAField(filter) {
  if (!type.isObject(filter)) return false;
  return ['replaceAddress', 'allowlist', 'regex'].some((field) => !type.isNone(filter[field]));
}

function resolveMailFilter({ connection, environment }) {
  if (connection.filter === false) return null;
  if (setsAField(connection.filter)) return connection.filter;
  return environment?.email?.filter ?? null;
}

export default resolveMailFilter;
