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

function sortedRoles(roles) {
  return [...(roles ?? [])].map(String).sort();
}

function sameRoles(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// The (page, role) targets of one page, each walked as a data set user: with
// production's role matrix for the page (coverage.json), its role sets, most
// sessions first, each as the first data set user whose sorted roles equal
// it (a role set no user has is not run); without one, one target per
// distinct role set among the data set's users, in file order; with no
// users, one target as the dev server's default headless user. --role
// (onlyUsers) keeps only those data set users. Returns { targets: [{ pageId,
// user, roles, matrixListed }], notRun: [{ pageId, roles, reason }] }.
function resolveRoles({ pageId, coverage, dataSet, onlyUsers = [] }) {
  const users = Object.entries(dataSet?.users ?? {}).map(([name, user]) => ({
    name,
    roles: sortedRoles(user.roles),
  }));
  const matrix = (coverage?.production?.roleMatrix ?? [])
    .filter((entry) => entry.page === pageId)
    .sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0));
  const targets = [];
  const notRun = [];

  if (matrix.length > 0) {
    matrix.forEach((entry) => {
      const roles = sortedRoles(entry.roles);
      const user = users.find((candidate) => sameRoles(candidate.roles, roles));
      if (type.isUndefined(user)) {
        notRun.push({
          pageId,
          roles,
          reason: `no data set user has roles [${roles.join(', ')}]`,
        });
        return;
      }
      targets.push({ pageId, user: user.name, roles, matrixListed: true });
    });
  } else if (users.length > 0) {
    const seen = [];
    users.forEach((user) => {
      if (seen.some((roles) => sameRoles(roles, user.roles))) return;
      seen.push(user.roles);
      targets.push({ pageId, user: user.name, roles: user.roles, matrixListed: false });
    });
  } else {
    targets.push({ pageId, user: null, roles: [], matrixListed: false });
  }

  if (onlyUsers.length === 0) {
    return { targets, notRun };
  }
  return { targets: targets.filter((target) => onlyUsers.includes(target.user)), notRun };
}

export default resolveRoles;
