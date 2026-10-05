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

import orderTargets from './orderTargets.js';
import resolveRoles from './resolveRoles.js';

// The pages a charter that names none walks, and every page of a run without
// charters: the scope's pages that are there for a reason other than a
// --charters file.
function defaultPageIds(scope) {
  return scope.pages
    .filter((page) => page.reasons.some((reason) => reason !== 'charter'))
    .map((page) => page.pageId);
}

// One target from each list in turn, so every charter's first target comes
// before any charter's second.
function interleave(lists) {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  const targets = [];
  for (let position = 0; position < longest; position += 1) {
    lists.forEach((list) => {
      if (position < list.length) targets.push(list[position]);
    });
  }
  return targets;
}

// The run's (page, role) targets in walk order. Without charters, every scope
// page as each role (--role keeps only those data set users), changed pages
// first (orderTargets). With charters (--charter, or a --charters file), each
// charter's targets are its pages (else the default pages) as its roles (else
// --role), each tagged with the charter's index, and the charters' ordered
// lists are interleaved so a budget that runs out mid-round has walked every
// charter. Returns { targets, notRun }, notRun without repeats.
function resolveWalkTargets({ scope, coverage, dataSet, roles, charters }) {
  if (roles.length > 0 && type.isNone(dataSet)) {
    throw new Error('--role names data set users, but no data set resolved. Name one with --data.');
  }
  const defaults = defaultPageIds(scope);
  const groups =
    charters.length === 0
      ? [{ charter: undefined, pageIds: defaults, onlyUsers: roles }]
      : charters.map((charter, index) => ({
          charter: index,
          pageIds: charter.pages ?? defaults,
          onlyUsers: charter.roles ?? roles,
        }));
  const notRun = new Map();
  const lists = groups.map((group) => {
    const targets = [];
    group.pageIds.forEach((pageId) => {
      const resolved = resolveRoles({ pageId, coverage, dataSet, onlyUsers: group.onlyUsers });
      resolved.targets.forEach((target) => {
        targets.push(
          type.isUndefined(group.charter) ? target : { ...target, charter: group.charter }
        );
      });
      resolved.notRun.forEach((entry) => notRun.set(JSON.stringify(entry), entry));
    });
    return orderTargets({ scopePages: scope.pages, targets });
  });
  return { targets: interleave(lists), notRun: [...notRun.values()] };
}

export default resolveWalkTargets;
