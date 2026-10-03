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

const staleAfterDays = 14;

function formatSnapshot({ name, snapshot }) {
  if (type.isNone(snapshot)) {
    return `      data ${name}: fixtures only`;
  }
  const days = snapshot.ageDays === 1 ? 'day' : 'days';
  const line = `data ${name}: snapshot ${snapshot.ageDays} ${days} old, ${(
    snapshot.documents ?? 0
  ).toLocaleString('en-US')} documents`;
  if (snapshot.ageDays > staleAfterDays) {
    return `      warning: ${line}. Run: lowdefy data pull ${name}`;
  }
  return `      ${line}`;
}

// The data set a journey ran on and the warnings its run returned, each printed once per run.
// A stale snapshot is a warning, never a failure.
function formatJourneyDataSet({ result, seen }) {
  const lines = [];
  const name = result.data?.name;
  if (type.isString(name) && !seen.has(`data:${name}`)) {
    seen.add(`data:${name}`);
    lines.push(formatSnapshot({ name, snapshot: result.data.snapshot }));
  }
  (result.warnings ?? []).forEach((warning) => {
    if (seen.has(`warning:${warning}`)) return;
    seen.add(`warning:${warning}`);
    lines.push(`      warning: ${warning}`);
  });
  return lines;
}

export default formatJourneyDataSet;
