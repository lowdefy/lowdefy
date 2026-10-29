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

const FIELDS = ['source', 'line', 'config'];

function formatIds({ ids, label, limit }) {
  if (ids.length === 0) {
    return [];
  }
  const shown = ids.slice(0, limit).join(', ');
  const rest = ids.length > limit ? `, and ${ids.length - limit} more` : '';
  return [`${label}: ${shown}${rest}`];
}

function formatDifference({ id, old: before, new: after }) {
  if (before === null || after === null) {
    const describe = (location) =>
      location === null ? '(does not resolve)' : JSON.stringify(location);
    return [`${id}: ${describe(before)} → ${describe(after)}`];
  }
  return FIELDS.filter((field) => before[field] !== after[field]).map(
    (field) => `${id}: ${field} ${JSON.stringify(before[field])} → ${JSON.stringify(after[field])}`
  );
}

// The key map comparison as lines: the counts, then the first `limit` ids
// on one side only and the first `limit` differing ids, a line per field.
function formatKeyMapComparison({ comparison, limit = 20 }) {
  const { checked, differences, extraIds, identical, missingIds } = comparison;
  const lines = [
    `${checked} key ids resolved on both sides; ${missingIds.length} only in old, ` +
      `${extraIds.length} only in new, ${differences.length} resolve differently.`,
    ...formatIds({ ids: missingIds, label: 'Only in old', limit }),
    ...formatIds({ ids: extraIds, label: 'Only in new', limit }),
  ];
  differences.slice(0, limit).forEach((difference) => {
    lines.push(...formatDifference(difference));
  });
  if (differences.length > limit) {
    lines.push(`… and ${differences.length - limit} more ids that resolve differently.`);
  }
  lines.push(identical ? 'Key maps say the same.' : 'Key maps differ.');
  return lines;
}

export default formatKeyMapComparison;
