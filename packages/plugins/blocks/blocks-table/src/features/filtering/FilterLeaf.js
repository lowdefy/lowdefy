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
import { Button, Select } from 'antd';
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';
import getOperators from '@lowdefy/blocks-antd/table/getOperators.js';

import changeLeafOperator from './changeLeafOperator.js';
import CloseIcon from './CloseIcon.js';
import createDefaultLeaf from './createDefaultLeaf.js';
import getOperatorLabel from './getOperatorLabel.js';
import getPlainTitle from './getPlainTitle.js';
import ValueEditor from './ValueEditor.js';

// One condition row: column, operator (the column type's operators), value, remove. The column
// select is left out when the builder only offers one column (the column filter popover).
function FilterLeaf({ leaf, columns, components, user, onChange, onRemove }) {
  const column = columns.find((entry) => entry.key === leaf.key) ?? null;
  const family = column ? CELL_TYPE_FAMILIES[column.type] : null;
  const operators = column ? getOperators(column.type) : [];
  return (
    <div className="lf-filter-leaf" data-col-key={leaf.key} data-lf-filter-leaf="">
      {columns.length > 1 || column === null ? (
        <Select
          aria-label="Column"
          className="lf-filter-column"
          onChange={(key) =>
            onChange(createDefaultLeaf({ column: columns.find((entry) => entry.key === key) }))
          }
          optionFilterProp="label"
          options={columns.map((entry) => ({ value: entry.key, label: getPlainTitle(entry) }))}
          placeholder="Column"
          popupMatchSelectWidth={false}
          showSearch
          size="small"
          value={column ? leaf.key : undefined}
        />
      ) : null}
      {column ? (
        <Select
          aria-label="Operator"
          className="lf-filter-operator"
          onChange={(op) => onChange(changeLeafOperator({ leaf, op }))}
          options={operators.map((op) => ({ value: op, label: getOperatorLabel({ op, family }) }))}
          popupMatchSelectWidth={false}
          size="small"
          value={leaf.op}
        />
      ) : null}
      {column ? (
        <ValueEditor
          column={column}
          components={components}
          onChange={(value) => onChange({ ...leaf, value })}
          op={leaf.op}
          user={user}
          value={leaf.value}
        />
      ) : null}
      <Button
        aria-label="Remove condition"
        className="lf-filter-remove"
        icon={<CloseIcon />}
        onClick={onRemove}
        size="small"
        type="text"
      />
    </div>
  );
}

export default FilterLeaf;
