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

import { get } from '@lowdefy/helpers';

/**
 * The List's items grouped into sections by their `sectionKey` value, for the sticky section
 * headers of a SectionList. Items with the same value next to each other form one section, so the
 * order of the list is kept; sort the list by the key to get one section per value.
 *
 * @param {Object} params
 * @param {number} params.count The number of rendered items.
 * @param {string} params.sectionKey The path in each item of the section title.
 * @param {Array} params.value The List's array in state.
 * @returns {{ title: string, data: number[] }[]} Sections of item indices.
 */
function getSections({ count, sectionKey, value }) {
  const sections = [];
  for (let index = 0; index < count; index += 1) {
    const title = `${get(value, `${index}.${sectionKey}`, { default: '' })}`;
    const last = sections[sections.length - 1];
    if (last && last.title === title) {
      last.data.push(index);
    } else {
      sections.push({ title, data: [index] });
    }
  }
  return sections;
}

export default getSections;
