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

import { listDataSets, parseDataSet } from '@lowdefy/node-utils';

// Every user of every data set under tests/data, as { dataSet, user, roles },
// in data set then file order: the callers a journey can run as.
async function readDataSetUsers({ configDirectory }) {
  const users = [];
  for (const { name } of await listDataSets({ configDirectory })) {
    const dataSet = await parseDataSet({ configDirectory, name });
    Object.entries(dataSet.users ?? {}).forEach(([user, entry]) => {
      users.push({ dataSet: name, user, roles: (entry.roles ?? []).map(String) });
    });
  }
  return users;
}

export default readDataSetUsers;
