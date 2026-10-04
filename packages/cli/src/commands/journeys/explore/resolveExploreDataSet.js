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
import { type } from '@lowdefy/helpers';

const DEFAULT_DATA_SET = 'default';

// The data set the walks run on: --data, else tests/data/default.yaml, else
// the only data set in tests/data. Several data sets and no default is an
// error that lists them. Returns { name, dataSet } (parseDataSet's result),
// or { name: null, dataSet: null } when the app declares none.
async function resolveExploreDataSet({ configDirectory, data }) {
  let name = data;
  if (type.isNone(name)) {
    const names = (await listDataSets({ configDirectory })).map((entry) => entry.name);
    if (names.length === 0) {
      return { name: null, dataSet: null };
    }
    if (names.includes(DEFAULT_DATA_SET)) {
      name = DEFAULT_DATA_SET;
    } else if (names.length === 1) {
      [name] = names;
    } else {
      throw new Error(
        `tests/data declares several data sets (${names.join(
          ', '
        )}) and no default.yaml. Name one with --data <name>.`
      );
    }
  }
  return { name, dataSet: await parseDataSet({ configDirectory, name }) };
}

export default resolveExploreDataSet;
