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
import { Button, Segmented } from 'antd';

import CloseIcon from './CloseIcon.js';
import createDefaultLeaf from './createDefaultLeaf.js';
import FilterLeaf from './FilterLeaf.js';
import getGroupOperator from './getGroupOperator.js';

// Groups nest three levels deep, as in Notion's advanced filters.
const MAX_DEPTH = 3;

const OPERATORS = [
  { value: 'and', label: 'All' },
  { value: 'or', label: 'Any' },
];

function FilterGroup({ group, columns, components, user, depth, onChange, onRemove }) {
  const operator = getGroupOperator(group);
  const children = group[operator];
  const canAdd = columns.length > 0;

  function setChildren(next) {
    onChange({ [operator]: next });
  }
  function setChild(index, child) {
    setChildren(children.map((existing, i) => (i === index ? child : existing)));
  }
  function removeChild(index) {
    setChildren(children.filter((existing, i) => i !== index));
  }

  return (
    <div className="lf-filter-group" data-depth={depth} data-lf-filter-group="">
      <div className="lf-filter-group-header">
        <Segmented
          aria-label="Match"
          onChange={(next) => onChange({ [next]: children })}
          options={OPERATORS}
          size="small"
          value={operator}
        />
        <span className="lf-filter-group-label">of these conditions</span>
        {onRemove ? (
          <Button
            aria-label="Remove group"
            className="lf-filter-remove"
            icon={<CloseIcon />}
            onClick={onRemove}
            size="small"
            type="text"
          />
        ) : null}
      </div>
      <div className="lf-filter-group-items">
        {children.map((child, index) =>
          getGroupOperator(child) === null ? (
            <FilterLeaf
              columns={columns}
              components={components}
              key={index}
              leaf={child}
              onChange={(next) => setChild(index, next)}
              onRemove={() => removeChild(index)}
              user={user}
            />
          ) : (
            <FilterGroup
              columns={columns}
              components={components}
              depth={depth + 1}
              group={child}
              key={index}
              onChange={(next) => setChild(index, next)}
              onRemove={() => removeChild(index)}
              user={user}
            />
          )
        )}
      </div>
      <div className="lf-filter-group-actions">
        <Button
          disabled={!canAdd}
          onClick={() => setChildren([...children, createDefaultLeaf({ column: columns[0] })])}
          size="small"
          type="link"
        >
          + Add condition
        </Button>
        {depth < MAX_DEPTH ? (
          <Button
            disabled={!canAdd}
            onClick={() =>
              setChildren([...children, { and: [createDefaultLeaf({ column: columns[0] })] }])
            }
            size="small"
            type="link"
          >
            + Add group
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default FilterGroup;
