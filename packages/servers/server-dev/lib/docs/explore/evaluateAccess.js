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

import admitsRoles from './admitsRoles.js';
import findingKey from './findingKey.js';
import readBuiltArtifact from '../rails/readBuiltArtifact.js';

// The walk's access at open. A redirect away from the asked-for page is a
// role-refused finding only when the head build's page auth admits the
// walking role set and production use shows that role set on the page (the
// explorer passes roleMatrixListed). A redirect the page's auth intends is no
// finding: admitted false tells the explorer to report it as refused or as
// access changed. Returns { admitted, finding } (finding null when none).
function evaluateAccess({ buildDirectory, pageId, observation, roles, roleMatrixListed }) {
  if (observation.redirected !== true) {
    return { admitted: true, finding: null };
  }
  const page = readBuiltArtifact({ buildDirectory, name: `pages/${pageId}.json` });
  const admitted = page !== null && admitsRoles({ auth: page.auth, roles });
  if (!admitted || roleMatrixListed !== true) {
    return { admitted, finding: null };
  }
  const finding = {
    kind: 'role-refused',
    severity: 'error',
    message: `Page "${pageId}" admits roles [${roles.join(
      ', '
    )}], which production use shows on it, but sent the walk to ${
      observation.pageId ?? observation.url
    }.`,
    pageId,
    source: null,
    configKey: null,
  };
  return { admitted, finding: { ...finding, key: findingKey(finding) } };
}

export default evaluateAccess;
