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

function plural({ count, one, many }) {
  return `${numberFormat.format(count)} ${count === 1 ? one : many}`;
}

// The header progress chip's text, "12 running · 3 queued · 2 errors", or '' when nothing is
// queued, running or failed.
function formatRunCounts(counts) {
  const parts = [];
  if (counts.running > 0) parts.push(`${numberFormat.format(counts.running)} running`);
  if (counts.queued > 0) parts.push(`${numberFormat.format(counts.queued)} queued`);
  if (counts.error > 0) parts.push(plural({ count: counts.error, one: 'error', many: 'errors' }));
  return parts.join(' · ');
}

export default formatRunCounts;
