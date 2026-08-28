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

/**
 * Shared helpers for the antd `./static` report renderers.
 *
 * Renderers emit plain report-IR object literals — never pdfmake or ExcelJS
 * objects, and never a constructor imported from `@lowdefy/reports`. Keeping
 * the block package free of the reports dependency is deliberate: only
 * `@lowdefy/reports` carries pdfmake/ExcelJS. The IR shape is a stable,
 * versioned contract, and the walker validates every returned node, so a typo
 * surfaces as a ConfigError in dev.
 */

import { type } from '@lowdefy/helpers';

/** True when a value would render nothing (null, undefined, or empty string). */
export function isBlank(value) {
  return type.isNone(value) || value === '';
}

/** Build a table cell: `value` is the raw datum, `formatted` the display string. */
export function cell(value, formatted) {
  return { value, ...(formatted !== undefined ? { formatted } : {}) };
}

/**
 * Linearise a panelled container (Tabs, Collapse) into a `stack`: each panel
 * title becomes a `heading`, followed by the container's children.
 *
 * The walker hands a container its children as one flat, already-walked list
 * with no per-panel boundaries, so the titles lead the content rather than
 * interleaving with each panel's own blocks. This preserves every title and
 * every block; only the panel grouping is lost. Returns null when there is
 * nothing to show.
 */
export function linearizePanels({ panels, children }) {
  const nodes = [];
  (type.isArray(panels) ? panels : []).forEach((panel) => {
    const title = panel?.title ?? panel?.key;
    if (!isBlank(title)) nodes.push({ kind: 'heading', text: String(title), level: 4 });
  });
  nodes.push(...(children ?? []));
  if (nodes.length === 0) return null;
  return { kind: 'stack', children: nodes };
}
