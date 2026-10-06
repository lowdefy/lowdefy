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

import readCoverage from '../readCoverage.js';

// What the data-set kinds read, all from files, with no dev server: the
// journey's data set, the data sets --empty-data and --volume-data name, and
// the role sets production used the start page with (coverage.json's role
// matrix, null when coverage has not been run here). An unreadable data set
// throws with parseDataSet's message.
async function readVariantDataSets({ context, journey }) {
  const configDirectory = context.directories.config;
  async function read(name) {
    return type.isNone(name) ? null : parseDataSet({ configDirectory, name });
  }
  const coverage = readCoverage({ directories: context.directories });
  const roleMatrix = type.isNone(coverage)
    ? null
    : (coverage.production?.roleMatrix ?? [])
        .filter((pair) => pair.page === journey.pageId)
        .map((pair) => pair.roles);
  return {
    dataSet: await read(journey.data),
    emptyDataSet: await read(context.options.emptyData),
    volumeDataSet: await read(context.options.volumeData),
    roleMatrix,
  };
}

export default readVariantDataSets;
