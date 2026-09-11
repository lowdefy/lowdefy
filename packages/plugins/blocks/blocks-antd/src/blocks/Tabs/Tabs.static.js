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
import { htmlToText, isBlank } from '@lowdefy/block-utils/report';

/**
 * Tabs → a `stack`: each tab's title as a level-4 heading followed by that
 * tab's own area, in tab order, so a section stays with its content. Tabs.js
 * derives the tab list from the area keys when `properties.tabs` is absent, and
 * keeps `extraAreaKey` out of the tabs, so the same happens here; any area no
 * tab names (the extra area included) is appended in key order. Returns null
 * when there is nothing to show.
 */
export const Tabs = {
  toReport: ({ block, areas = {} }) => {
    const { tabs, extraAreaKey } = block.properties;
    const configured = type.isArray(tabs)
      ? tabs.filter((tab) => type.isObject(tab))
      : Object.keys(areas)
          .filter((key) => key !== extraAreaKey)
          .map((key) => ({ key, title: key }));

    const nodes = [];
    const used = new Set();
    configured.forEach((tab) => {
      const title = tab.title ?? tab.key;
      if (!isBlank(title)) nodes.push({ kind: 'heading', text: htmlToText(title), level: 4 });
      if (!type.isNone(tab.key)) {
        nodes.push(...(areas[tab.key] ?? []));
        used.add(tab.key);
      }
    });
    Object.keys(areas)
      .filter((key) => !used.has(key))
      .forEach((key) => nodes.push(...areas[key]));

    if (nodes.length === 0) return null;
    return { kind: 'stack', children: nodes };
  },
};
