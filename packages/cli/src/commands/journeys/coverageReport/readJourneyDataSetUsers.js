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
import { parseDataSet } from '@lowdefy/node-utils';

// The users of each data set the journeys name, read once from tests/data, as
// a Map of data set name to its users object. A data set that cannot be read
// is warned about and left out, so the journeys on it count for no role set
// (as `lowdefy test --lint` reports the same file itself).
async function readJourneyDataSetUsers({ configDirectory, journeys, logger }) {
  const names = new Set(
    journeys.map((journey) => journey.data).filter((name) => !type.isNone(name))
  );
  const users = new Map();
  for (const name of names) {
    try {
      const dataSet = await parseDataSet({ configDirectory, name });
      users.set(name, dataSet.users);
    } catch (error) {
      logger.warn(`Role coverage leaves out journeys on data set "${name}": ${error.message}`);
    }
  }
  return users;
}

export default readJourneyDataSetUsers;
