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

function formatData({ name, documents }) {
  const word = documents === 1 ? 'document' : 'documents';
  return `      data ${name}: ${documents.toLocaleString('en-US')} ${word}`;
}

// The data set a journey ran on and the warnings its run returned, each printed once per run.
function formatJourneyDataSet({ result, seen }) {
  const lines = [];
  const name = result.data?.name;
  if (type.isString(name) && !seen.has(`data:${name}`)) {
    seen.add(`data:${name}`);
    lines.push(formatData(result.data));
  }
  (result.warnings ?? []).forEach((warning) => {
    if (seen.has(`warning:${warning}`)) return;
    seen.add(`warning:${warning}`);
    lines.push(`      warning: ${warning}`);
  });
  return lines;
}

export default formatJourneyDataSet;
