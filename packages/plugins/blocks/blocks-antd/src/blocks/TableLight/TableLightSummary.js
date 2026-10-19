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
import { Table } from 'antd';
import { get, type } from '@lowdefy/helpers';

import AGGREGATE_LABELS from '../../table/aggregateLabels.js';
import computeAggregate from '../../table/computeAggregate.js';
import getAggregateText from '../../table/getAggregateText.js';

// The footer row: each visible column that declares an `aggregate` shows it,
// calculated over every row (not just the current page).
function TableLightSummary({ columns, rows, fixed }) {
  return (
    <Table.Summary fixed={fixed}>
      <Table.Summary.Row className="lf-table-summary-row">
        {columns.map((column, index) => {
          if (type.isNone(column.aggregate)) {
            return <Table.Summary.Cell key={column.key} index={index} />;
          }
          const value = computeAggregate({
            fn: column.aggregate,
            values: rows.map((row) => get(row, column.field)),
            column,
          });
          const label = AGGREGATE_LABELS[column.aggregate];
          const text = getAggregateText({ fn: column.aggregate, value, column });
          return (
            <Table.Summary.Cell key={column.key} index={index} align={column.align}>
              <span className="lf-table-summary" data-aggregate={column.aggregate}>
                <span className="lf-table-summary-label">{label}</span>
                <span className="lf-table-summary-value">{text === '' ? '—' : text}</span>
              </span>
            </Table.Summary.Cell>
          );
        })}
      </Table.Summary.Row>
    </Table.Summary>
  );
}

export default TableLightSummary;
