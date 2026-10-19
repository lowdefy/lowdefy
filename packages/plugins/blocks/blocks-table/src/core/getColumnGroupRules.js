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

const SHOW_WHEN = new Set(['always', 'open', 'closed']);

function readShowWhen(node) {
  if (type.isUndefined(node.showWhen)) return 'always';
  if (!SHOW_WHEN.has(node.showWhen)) {
    throw new Error(
      `Table column "${node.key}" has unknown showWhen ${JSON.stringify(
        node.showWhen
      )}. Use always, open or closed.`
    );
  }
  return node.showWhen;
}

// A collapsed group with nothing left to show would take its header, and the chevron that opens
// it again, off the table.
function checkClosedChild(node) {
  if (node.children.some((child) => readShowWhen(child) !== 'open')) return;
  throw new Error(
    `Table column group "${node.key}" is collapsible, but every column in it has showWhen "open", so it shows nothing when collapsed. Give the column it collapses to showWhen "always" or "closed".`
  );
}

function walk({ nodes, owner, conditions, groups, conditionsByKey }) {
  nodes.forEach((node) => {
    const showWhen = readShowWhen(node);
    const own =
      owner !== null && showWhen !== 'always'
        ? [...conditions, { group: owner, showWhen }]
        : conditions;
    if (node.group !== true) {
      if (own.length > 0) conditionsByKey.set(node.key, own);
      return;
    }
    let childOwner = owner;
    if (node.collapsible === true) {
      checkClosedChild(node);
      groups.push({ key: node.key, collapsed: node.collapsed === true });
      childOwner = node.key;
    }
    walk({ nodes: node.children, owner: childOwner, conditions: own, groups, conditionsByKey });
  });
}

// Collapsible column groups, as AG Grid's `columnGroupShow`: a group with `collapsible: true`
// collapses to the columns and inner groups whose `showWhen` is `always` or `closed`, and expands
// to those that are `always` or `open`. `showWhen` is read against the nearest collapsible group
// above the column or inner group, so collapsing an outer group also hides an inner group with
// `showWhen: open` and every column under it. Returns the collapsible groups in config order with
// their starting state (`groups`) and, for each leaf column a group can hide, the conditions it
// is shown under (`conditionsByKey`: leaf key to `[{ group, showWhen }]`, every one must hold).
function getColumnGroupRules({ headerGroups }) {
  const groups = [];
  const conditionsByKey = new Map();
  walk({ nodes: headerGroups, owner: null, conditions: [], groups, conditionsByKey });
  return { groups, conditionsByKey };
}

export default getColumnGroupRules;
