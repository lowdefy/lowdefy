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

import { get, type } from '@lowdefy/helpers';

function getCount({ configured, length, showCount }) {
  if (!type.isNone(configured)) return configured;
  if (showCount === true) return length;
  return undefined;
}

function getItemKey({ index, sectionKey, value }) {
  return `${get(value, `${index}.${sectionKey}`, { default: '' })}`;
}

function getHeaderSection({ count, header, showCount }) {
  const config = type.isString(header) ? { title: header } : header ?? {};
  return {
    key: '',
    title: config.title,
    count: getCount({ configured: config.count, length: count, showCount }),
    footer: config.footer,
    status: config.status,
    data: Array.from({ length: count }, (item, index) => index),
  };
}

// Without `sections`, neighbouring items with the same key form a section, so the list's own
// order is kept.
function groupNeighbours({ count, sectionKey, showCount, value }) {
  const groups = [];
  for (let index = 0; index < count; index += 1) {
    const key = getItemKey({ index, sectionKey, value });
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.data.push(index);
    } else {
      groups.push({ key, title: key, data: [index] });
    }
  }
  return groups.map((group) => ({
    ...group,
    count: getCount({ length: group.data.length, showCount }),
  }));
}

// With `sections`, every item joins its key's section, in the order `sections` lists them. Keys
// it does not list follow, in the order they first appear, titled by their key. A listed
// section without a title has no header. Empty sections are left out.
function groupBySections({ count, sectionKey, sections, showCount, value }) {
  const byKey = new Map();
  sections.forEach((section) => {
    byKey.set(`${section.key}`, { section, data: [] });
  });
  for (let index = 0; index < count; index += 1) {
    const key = getItemKey({ index, sectionKey, value });
    if (!byKey.has(key)) {
      byKey.set(key, { section: { key, title: key }, data: [] });
    }
    byKey.get(key).data.push(index);
  }
  return [...byKey.entries()]
    .filter(([, { data }]) => data.length > 0)
    .map(([key, { section, data }]) => ({
      key,
      title: section.title,
      count: getCount({ configured: section.count, length: data.length, showCount }),
      footer: section.footer,
      status: section.status,
      data,
    }));
}

/**
 * The List's items as titled sections of item indices, for its SectionList. Without a
 * `sectionKey` the List is one section, titled by `header`. With one, items are grouped by the
 * value at that path: neighbouring items with the same value form a section, or, with
 * `sections`, every item joins its value's section in the order `sections` gives.
 *
 * @param {Object} params
 * @param {number} params.count The number of rendered items.
 * @param {string|Object} [params.header] The one section's title, or `{ title, count, status, footer }`.
 * @param {string} [params.sectionKey] The path in each item of its section's key.
 * @param {{ key: string, title?: string, count?: number|string, status?: string|Object,
 *   footer?: string }[]} [params.sections] The sections' order, titles and counts.
 * @param {boolean} [params.showCount] Count each section's items in its header.
 * @param {Array} params.value The List's array in state.
 * @returns {{ key: string, title?: string, count?: number|string, footer?: string,
 *   status?: string|Object, data: number[] }[]}
 */
function getSections({ count, header, sectionKey, sections, showCount, value }) {
  if (!type.isString(sectionKey)) {
    return [getHeaderSection({ count, header, showCount })];
  }
  if (type.isArray(sections)) {
    return groupBySections({ count, sectionKey, sections, showCount, value });
  }
  return groupNeighbours({ count, sectionKey, showCount, value });
}

export default getSections;
