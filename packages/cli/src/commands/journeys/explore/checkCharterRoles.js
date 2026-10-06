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

// Every role a --charters file names is a data set user, as --role takes it.
// Checked once the data set is known, so the refusal names the charter.
function checkCharterRoles({ charters, dataSet }) {
  charters.forEach((charter, index) => {
    if (type.isUndefined(charter.roles)) return;
    if (type.isNone(dataSet)) {
      throw new Error(
        `Charter ${index + 1} ("${
          charter.goal
        }") names roles, which are data set users, but no data set resolved. Name one with --data.`
      );
    }
    charter.roles.forEach((user) => {
      if (!(user in (dataSet.users ?? {}))) {
        throw new Error(
          `Charter ${index + 1} ("${
            charter.goal
          }") names role "${user}", which is not a user in the data set.`
        );
      }
    });
  });
}

export default checkCharterRoles;
