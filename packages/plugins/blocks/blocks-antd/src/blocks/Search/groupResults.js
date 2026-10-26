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
// Each result goes to the first group whose `match` fields it equals, else to "Other". A section
// keeps its full match count in `total` and shows at most `limit` rows.
function groupResults({ results, groups, defaultLimit }) {
  const grouped = new Map();
  const other = [];

  for (const result of results) {
    const group = groups.find((candidate) =>
      Object.entries(candidate.match ?? {}).every(([field, val]) => result[field] === val)
    );
    if (group) {
      if (!grouped.has(group.label)) {
        grouped.set(group.label, { ...group, items: [] });
      }
      grouped.get(group.label).items.push(result);
    } else {
      other.push(result);
    }
  }

  const sections = [];
  for (const group of groups) {
    const entry = grouped.get(group.label);
    if (entry) {
      const limit = group.limit > 0 ? group.limit : defaultLimit;
      sections.push({ ...entry, total: entry.items.length, items: entry.items.slice(0, limit) });
    }
  }
  if (other.length > 0) {
    sections.push({ label: 'Other', items: other.slice(0, defaultLimit), total: other.length });
  }
  return sections;
}

export default groupResults;
