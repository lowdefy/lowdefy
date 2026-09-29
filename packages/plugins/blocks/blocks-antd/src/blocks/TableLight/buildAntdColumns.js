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

import React from 'react';
import { Tooltip } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import renderCell from '../../table/renderCell.js';

const SORT_DIRECTIONS = ['ascend', 'descend'];

function getSortOrder({ sort, key }) {
  if (sort === null || sort.key !== key) return null;
  return sort.desc ? 'descend' : 'ascend';
}

function renderTitle({ node, methods }) {
  const title = renderHtml({ html: node.title, methods });
  if (type.isNone(node.headerTooltip)) return title;
  return (
    <Tooltip title={renderHtml({ html: node.headerTooltip, methods })}>
      <span className="lf-table-header-tooltip">{title}</span>
    </Tooltip>
  );
}

// antd Table columns from the normalised header tree. Sorting is controlled:
// antd only shows the sort state and reports clicks (`sorter: true`), while
// the block sorts the rows itself, so antd's own compare never runs. Each
// cell gets `data-col-key`, which the block's one click listener reads.
function buildAntdColumns({ nodes, compiledByKey, sort, getRowKey, methods, components, onEvent }) {
  return nodes.map((node) => {
    if (node.group === true) {
      return {
        key: node.key,
        title: renderTitle({ node, methods }),
        children: buildAntdColumns({
          nodes: node.children,
          compiledByKey,
          sort,
          getRowKey,
          methods,
          components,
          onEvent,
        }),
      };
    }
    const column = compiledByKey[node.key];
    const cellAttributes = { 'data-col-key': column.key };
    return {
      key: column.key,
      title: renderTitle({ node: column, methods }),
      align: column.align,
      // The header puts an end-aligned column's sort icon before its title (tableLight.css).
      className: column.align === 'end' ? 'lf-table-light-align-end' : undefined,
      width: column.width,
      minWidth: column.minWidth,
      fixed: column.pinned,
      hidden: column.hidden,
      sorter: column.sortable === true,
      sortOrder: getSortOrder({ sort, key: column.key }),
      sortDirections: SORT_DIRECTIONS,
      onCell: () => cellAttributes,
      render: (_, row) =>
        renderCell({ column, row, rowKey: getRowKey(row), methods, components, onEvent }),
    };
  });
}

export default buildAntdColumns;
