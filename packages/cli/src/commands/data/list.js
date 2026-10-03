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

const staleAfterDays = 14;

function formatDataSet(dataSet) {
  if (dataSet.kind === 'fixtures') {
    return { level: 'info', line: `${dataSet.name}: fixtures only` };
  }
  if (dataSet.pulledAt === undefined) {
    return {
      level: 'warn',
      line: `${dataSet.name}: snapshot from ${dataSet.from}, not pulled. Run: lowdefy data pull ${dataSet.name}`,
    };
  }
  const days = dataSet.ageDays === 1 ? 'day' : 'days';
  const parts = [
    `${dataSet.name}: snapshot from ${dataSet.from}, pulled ${dataSet.pulledAt.slice(0, 10)}`,
    `${dataSet.ageDays} ${days} old`,
    `${dataSet.documents.toLocaleString('en-US')} documents`,
  ];
  if (!dataSet.specMatches) {
    parts.push('spec changed: pull again');
  }
  const stale = dataSet.ageDays > staleAfterDays;
  return { level: !dataSet.specMatches || stale ? 'warn' : 'info', line: parts.join(', ') };
}

// `lowdefy data list`: each data set in tests/data and its snapshot's age.
async function list({ context }) {
  const dataSets = await listDataSets({ configDirectory: context.directories.config });
  if (dataSets.length === 0) {
    context.logger.info('No data sets. Add one at tests/data/<name>.yaml.');
  }
  dataSets.forEach((dataSet) => {
    const { level, line } = formatDataSet(dataSet);
    context.logger[level](line);
  });
  context.sendTelemetry();
}

export default list;
