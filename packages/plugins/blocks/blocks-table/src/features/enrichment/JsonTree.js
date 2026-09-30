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

import React, { useState } from 'react';
import { type } from '@lowdefy/helpers';
import resolveTagTone from '@lowdefy/block-utils/format/resolveTagTone.js';

import formatJsonPreview from './formatJsonPreview.js';
import getJsonChildren from './getJsonChildren.js';
import getJsonValueKind from './getJsonValueKind.js';
import RunIcon from './RunIcon.js';

const PAGE = 100;

// Value colours: tag tone text colours, which read at 4.5:1 on light and dark panels.
const TREE_STYLE = {
  '--lf-json-string': resolveTagTone('green').text,
  '--lf-json-number': resolveTagTone('geekblue').text,
  '--lf-json-boolean': resolveTagTone('purple').text,
};

// One node of the raw result tree: a toggle for objects and arrays (children render only once
// expanded, a page of 100 at a time), the key, a preview coloured by its kind and cut to the
// panel's width (the whole value in its title), and a "+" that adds the node as an extract
// column, always shown (muted until the row is hovered or it has focus).
function JsonNode({ depth, label, onAdd, path, value }) {
  const [open, setOpen] = useState(depth === 0);
  const [limit, setLimit] = useState(PAGE);
  const [adding, setAdding] = useState(false);
  const expandable = (type.isArray(value) || type.isObject(value)) && Object.keys(value).length > 0;
  const { total, children } =
    open && expandable ? getJsonChildren({ value, path, limit }) : { total: 0, children: [] };
  async function add() {
    setAdding(true);
    await onAdd({ path, value });
    setAdding(false);
  }
  return (
    <li
      aria-expanded={expandable ? open : undefined}
      className="lf-enrich-json-node"
      data-lf-json-node={path}
      role="treeitem"
    >
      <div className="lf-enrich-json-row" style={{ paddingInlineStart: depth * 16 }}>
        {expandable ? (
          <button
            aria-label={open ? 'Collapse' : 'Expand'}
            className="lf-enrich-json-toggle"
            data-lf-json-toggle={path}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="lf-enrich-json-toggle" />
        )}
        <span className="lf-enrich-json-key">{label}</span>
        {open && expandable ? null : (
          <span
            className="lf-enrich-json-preview"
            data-kind={getJsonValueKind(value)}
            title={formatJsonPreview(value)}
          >
            {formatJsonPreview(value)}
          </span>
        )}
        <button
          aria-label={`Add ${label} as column`}
          className="lf-enrich-json-add"
          data-lf-json-add={path}
          disabled={adding}
          onClick={add}
          title="Add as column"
          type="button"
        >
          {adding ? (
            <span aria-hidden="true" className="lf-enrich-spinner" />
          ) : (
            <RunIcon name="add" />
          )}
        </button>
      </div>
      {open && children.length > 0 ? (
        <ul className="lf-enrich-json-children" role="group">
          {children.map((child) => (
            <JsonNode
              depth={depth + 1}
              key={child.key}
              label={child.key}
              onAdd={onAdd}
              path={child.path}
              value={child.value}
            />
          ))}
          {total > children.length ? (
            <li className="lf-enrich-json-more">
              <button
                data-lf-json-more={path}
                onClick={() => setLimit(limit + PAGE)}
                style={{ marginInlineStart: (depth + 1) * 16 }}
                type="button"
              >
                Show {Math.min(PAGE, total - children.length)} more of {total - children.length}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

// A cell's raw provider result as a collapsible tree (the details panel). The root, named
// `label` (the column's title), is open; every node, leaf or object, can be added as an extract
// column. Keys, strings, numbers and booleans each have their colour.
function JsonTree({ label, onAdd, value }) {
  return (
    <ul
      aria-label="Raw result"
      className="lf-enrich-json"
      data-lf-json-tree=""
      role="tree"
      style={TREE_STYLE}
    >
      <JsonNode depth={0} label={label} onAdd={onAdd} path="" value={value} />
    </ul>
  );
}

export default JsonTree;
