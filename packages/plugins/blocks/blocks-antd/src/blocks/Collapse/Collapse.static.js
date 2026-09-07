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
 * Collapse → a `stack`: each panel's title as a level-4 heading followed by
 * that panel's own area and then its `extraKey` area, in panel order, so a
 * section stays with its content. Collapse.js derives the panels from the area
 * keys when `properties.panels` is absent, so the same happens here; any area
 * no panel names is appended in key order. Returns null when there is nothing
 * to show.
 */
export const Collapse = {
  toReport: ({ block, areas = {} }) => {
    const { panels } = block.properties;
    const configured = type.isArray(panels)
      ? panels.filter((panel) => type.isObject(panel))
      : Object.keys(areas).map((key) => ({ key, title: key }));

    const nodes = [];
    const used = new Set();
    configured.forEach((panel) => {
      const title = panel.title ?? panel.key;
      if (!isBlank(title)) nodes.push({ kind: 'heading', text: htmlToText(title), level: 4 });
      [panel.key, panel.extraKey].forEach((key) => {
        if (type.isNone(key)) return;
        nodes.push(...(areas[key] ?? []));
        used.add(key);
      });
    });
    Object.keys(areas)
      .filter((key) => !used.has(key))
      .forEach((key) => nodes.push(...areas[key]));

    if (nodes.length === 0) return null;
    return { kind: 'stack', children: nodes };
  },
};
