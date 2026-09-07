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

import { isReserved } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// buildAuth runs before validateId sees page, endpoint and agent ids, and it keys
// plain-object role maps on them: getPageRoles, getApiRoles and getAgentRoles all
// build `roles[id]` and read it back with a truthiness check. A reserved id reads
// through Object.prototype there, so the entity is silently marked protected with
// Object.prototype as its roles - and the object then travels into addKeys, which
// stamps a '~k' onto Object.prototype and corrupts every plain object in the
// process. Gate the ids here, where buildAuth first touches them.
//
// validateId reports the same ids again in buildApi, buildAgents and buildPages;
// logCollectedErrors collapses the pair on source line plus message so the author
// reads it once.
function rejectReservedEntityIds({ components }) {
  const entityTypes = [
    { items: components.pages, field: 'Page id' },
    { items: components.api, field: 'Endpoint id' },
    { items: components.agents, field: 'Agent id' },
  ];
  entityTypes.forEach(({ items, field }) => {
    (items ?? []).forEach((item) => {
      if (!isReserved(item.id)) return;
      throw new ConfigError(
        `${field} "${item.id}" is a reserved name and cannot be used as an id.`,
        { configKey: item['~k'] }
      );
    });
  });
}

export default rejectReservedEntityIds;
