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

// Result rows are grouped by the `groups` the block is given. A group with a `limit` shows that
// many rows and keeps its full match count in `total`.

function hasGroupLimit(groups) {
  return (groups ?? []).some((group) => group.limit > 0);
}

function groupResults(results, groups, resultMapping) {
  if (!groups || groups.length === 0)
    return [{ label: null, items: results, total: results.length }];

  const grouped = new Map();
  const other = [];

  for (const result of results) {
    let matched = false;
    for (const group of groups) {
      const matchEntries = Object.entries(group.match ?? {});
      if (matchEntries.every(([field, val]) => result[field] === val)) {
        if (!grouped.has(group.label)) {
          grouped.set(group.label, { ...group, items: [] });
        }
        grouped.get(group.label).items.push(result);
        matched = true;
        break;
      }
    }
    if (!matched) {
      other.push(result);
    }
  }

  const sections = [];
  for (const group of groups) {
    const entry = grouped.get(group.label);
    if (entry && entry.items.length > 0) {
      const total = entry.items.length;
      sections.push({
        ...entry,
        total,
        items: group.limit > 0 ? entry.items.slice(0, group.limit) : entry.items,
      });
    }
  }
  if (other.length > 0) {
    sections.push({ label: 'Other', items: other, total: other.length });
  }
  return sections;
}

// With no group limit `maxResults` caps the whole list, as it always has. With a group limit the
// groups cap themselves, so the list is not cut first and each group's count stays true.
function buildSections({ results, groups, resultMapping, maxResults }) {
  const considered = hasGroupLimit(groups) ? results : results.slice(0, maxResults);
  return groupResults(considered, groups, resultMapping);
}

// `{query}` in a string, at any depth, becomes the typed query.
function fillQuery(value, query) {
  if (typeof value === 'string') return value.replaceAll('{query}', query);
  if (Array.isArray(value)) return value.map((item) => fillQuery(item, query));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillQuery(v, query)]));
  }
  return value;
}

export { buildSections, fillQuery, groupResults, hasGroupLimit };
