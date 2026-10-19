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

import { listDataSets } from '@lowdefy/node-utils';

function plural({ count, word }) {
  return `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`;
}

// `lowdefy data list`: each data set in tests/data with the documents and users it loads.
async function list({ context }) {
  const dataSets = await listDataSets({ configDirectory: context.directories.config });
  if (dataSets.length === 0) {
    context.logger.info('No data sets. Add one at tests/data/<name>.yaml.');
  }
  dataSets.forEach((dataSet) => {
    context.logger.info(
      `${dataSet.name}: ${plural({ count: dataSet.documents, word: 'document' })}, ${plural({
        count: dataSet.users,
        word: 'user',
      })}`
    );
  });
  context.sendTelemetry();
}

export default list;
