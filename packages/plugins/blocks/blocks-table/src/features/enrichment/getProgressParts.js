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

const numberFormat = new Intl.NumberFormat();

// The statuses the chip counts, in the chip's order, with their labels.
const STATUSES = [
  { status: 'running', one: 'running', many: 'running' },
  { status: 'queued', one: 'queued', many: 'queued' },
  { status: 'error', one: 'error', many: 'errors' },
];

// The most severe status first, with the tag tone (`resolveTagTone`) it gives the whole chip.
const SEVERITY = [
  { status: 'error', tone: 'error' },
  { status: 'running', tone: 'processing' },
  { status: 'queued', tone: 'default' },
];

// The header progress chip's content, or null when nothing is queued, running or failed: `parts`,
// `[{ status, count, text }]` for the statuses with cells ("3 running", "2 queued", "1 error");
// `text`, the parts joined ("3 running · 1 error"); `status`, the most severe one; and `tone`, its
// tag tone (an error makes the whole chip red, running blue, queued alone neutral).
function getProgressParts(counts) {
  const parts = STATUSES.filter(({ status }) => counts[status] > 0).map(({ status, one, many }) => {
    const count = counts[status];
    return {
      status,
      count: numberFormat.format(count),
      text: `${numberFormat.format(count)} ${count === 1 ? one : many}`,
    };
  });
  if (parts.length === 0) return null;
  const { status, tone } = SEVERITY.find((entry) => counts[entry.status] > 0);
  return { parts, status, text: parts.map((part) => part.text).join(' · '), tone };
}

export default getProgressParts;
