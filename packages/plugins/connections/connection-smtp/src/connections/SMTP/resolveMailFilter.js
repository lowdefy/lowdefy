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
// (config.environments.<env>.email.filter). `false` turns filtering off, the environment's too —
// for mail that must reach the real recipient in every environment. An unset (null) connection
// filter falls back to the environment's, so a missing value can never switch the safety net off.
function resolveMailFilter({ connection, environment }) {
  if (connection.filter === false) return null;
  if (!type.isNone(connection.filter)) return connection.filter;
  return environment?.email?.filter ?? null;
}

export default resolveMailFilter;
