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

// The lists of one answer hold at most this many characters, pretty-printed as
// the shim sends them, so the answer stays under 25,000 with its other fields.
// A client refuses an answer it cannot hold, and the agent then sees nothing.
const LIST_BUDGET = 20000;
// Failures get their full detail up to here; the rest of the budget then still
// names every other failure before any passing line is spent on.
const FAILED_DETAIL_BUDGET = 12000;
const MESSAGE_LIMIT = 300;

// The characters an item takes inside a list of the pretty-printed answer:
// its own text, four spaces of indent on each of its lines, a comma and a
// line break.
function printedSize(item) {
  const text = JSON.stringify(item, null, 2);
  return text.length + 4 * text.split('\n').length + 2;
}

function cutMessage(message) {
  if (!type.isString(message)) {
    return '';
  }
  return message.length > MESSAGE_LIMIT ? `${message.slice(0, MESSAGE_LIMIT)}...` : message;
}

function withoutZeros(counts) {
  return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));
}

// Fits a run's results into an answer an agent can always read: each failing
// or flaky journey in full while there is room, then by name and message, then
// the PASS line of each passing journey and the line of each skipped one.
// `omitted` counts what did not fit: failedDetail (failures named without
// their report), failed, passed and skipped (left out). The summary and the
// result file cover all of them.
function compactTestResults({ results, skipped }) {
  let used = 0;
  const omitted = { failedDetail: 0, failed: 0, passed: 0, skipped: 0 };

  const failed = [];
  results
    .filter((result) => result.passed !== true)
    .forEach((result) => {
      const size = printedSize(result);
      if (used + size <= FAILED_DETAIL_BUDGET) {
        failed.push(result);
        used += size;
        return;
      }
      const brief = {
        name: result.name,
        filePath: result.filePath,
        class: result.class,
        message: cutMessage(result.message),
      };
      const briefSize = printedSize(brief);
      if (used + briefSize <= LIST_BUDGET) {
        failed.push(brief);
        used += briefSize;
        omitted.failedDetail += 1;
        return;
      }
      omitted.failed += 1;
    });

  function takeLines({ entries, count }) {
    const lines = [];
    entries.forEach((entry) => {
      const size = printedSize(entry.report);
      if (used + size <= LIST_BUDGET) {
        lines.push(entry.report);
        used += size;
        return;
      }
      omitted[count] += 1;
    });
    return lines;
  }

  const passed = takeLines({
    entries: results.filter((result) => result.passed === true),
    count: 'passed',
  });
  const skippedLines = takeLines({ entries: skipped, count: 'skipped' });

  const left = withoutZeros(omitted);
  return {
    failed,
    passed,
    skipped: skippedLines,
    ...(Object.keys(left).length === 0 ? {} : { omitted: left }),
  };
}

export default compactTestResults;
