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

// Tries the configured API auth strategies in config order; the first
// verifier match wins. A strategy caller is a config-derived, org-less
// principal: roles are the strategy's static grant unioned with any
// claim-derived roles, and attributes are the static bag shallow-merged
// with claim-mapped values (claim wins), so _user.attributes reads the same
// for session and strategy callers.
async function resolveStrategyCaller({ headers, logger, strategies }) {
  for (const strategy of strategies ?? []) {
    const match = await strategy.verify({ headers, logger });
    if (type.isNone(match)) {
      continue;
    }
    const roles = [...new Set([...strategy.roles, ...(match.roles ?? [])])];
    const attributes = { ...strategy.attributes, ...(match.attributes ?? {}) };
    logger.debug(
      { event: 'auth_strategy_authenticated', authMethod: strategy.type, strategyId: strategy.id },
      `Request authenticated by auth strategy "${strategy.id}" (${strategy.type}).`
    );
    return {
      ...match.user,
      authMethod: strategy.type,
      strategyId: strategy.id,
      roles,
      attributes,
    };
  }
  return null;
}

export default resolveStrategyCaller;
