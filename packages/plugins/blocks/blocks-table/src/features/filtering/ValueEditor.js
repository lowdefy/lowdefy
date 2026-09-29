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
import { DatePicker, Select, Space, Tag } from 'antd';
import { get, type } from '@lowdefy/helpers';
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';

import DraftInput from './DraftInput.js';
import DraftInputNumber from './DraftInputNumber.js';
import formatFilterDate from './formatFilterDate.js';
import getValueShape from './getValueShape.js';
import parseFilterDate from './parseFilterDate.js';
import RelativeDateEditor from './RelativeDateEditor.js';

const BOOLEAN_OPTIONS = [
  { value: true, label: 'true' },
  { value: false, label: 'false' },
];

function UserValue({ path, user, onClear }) {
  const resolved = get(user, path);
  const title = type.isNone(resolved) ? path : `${path}: ${resolved}`;
  return (
    <Tag closable onClose={onClear} title={title}>
      Current user
    </Tag>
  );
}

function RangeNumbers({ value, onChange, size }) {
  const [from, to] = type.isArray(value) ? value : [null, null];
  return (
    <Space.Compact size={size}>
      <DraftInputNumber
        aria-label="From"
        onChange={(next) => onChange([next ?? null, to ?? null])}
        placeholder="From"
        value={from}
      />
      <DraftInputNumber
        aria-label="To"
        onChange={(next) => onChange([from ?? null, next ?? null])}
        placeholder="To"
        value={to}
      />
    </Space.Compact>
  );
}

function RangeDates({ column, value, onChange, size }) {
  const [from, to] = type.isArray(value) ? value : [null, null];
  return (
    <DatePicker.RangePicker
      allowEmpty={[true, true]}
      onChange={(dates) =>
        onChange([
          formatFilterDate({ column, date: dates?.[0], edge: 'start' }),
          formatFilterDate({ column, date: dates?.[1], edge: 'end' }),
        ])
      }
      size={size}
      value={[parseFilterDate(from), parseFilterDate(to)]}
    />
  );
}

// The value input for one condition, by the operator's value shape and the column's type family.
function ValueEditor({ column, op, value, onChange, user, size = 'small' }) {
  const shape = getValueShape(op);
  if (shape === 'none') return null;
  if (type.isObject(value) && type.isString(value.$user)) {
    return <UserValue onClear={() => onChange(undefined)} path={value.$user} user={user} />;
  }
  const family = CELL_TYPE_FAMILIES[column.type];
  // Columns come normalised by the shared core: options are [{ value, label, ... }].
  const { options } = column;
  const selectOptions = options?.map((option) => ({ value: option.value, label: option.label }));

  if (shape === 'relative') {
    return <RelativeDateEditor onChange={onChange} size={size} value={value} />;
  }
  if (shape === 'range') {
    if (family === 'date') {
      return <RangeDates column={column} onChange={onChange} size={size} value={value} />;
    }
    return <RangeNumbers onChange={onChange} size={size} value={value} />;
  }
  if (shape === 'list') {
    return (
      <Select
        aria-label="Values"
        className="lf-filter-value"
        mode={selectOptions ? 'multiple' : 'tags'}
        onChange={(next) => onChange(next.length ? next : undefined)}
        optionFilterProp="label"
        options={selectOptions}
        placeholder="Values"
        size={size}
        tokenSeparators={selectOptions ? undefined : [',']}
        value={type.isArray(value) ? value : []}
      />
    );
  }
  if (selectOptions && (op === 'eq' || op === 'ne')) {
    return (
      <Select
        aria-label="Value"
        className="lf-filter-value"
        onChange={onChange}
        optionFilterProp="label"
        options={selectOptions}
        placeholder="Value"
        showSearch
        size={size}
        value={value}
      />
    );
  }
  if (family === 'boolean') {
    return (
      <Select
        aria-label="Value"
        className="lf-filter-value"
        onChange={onChange}
        options={BOOLEAN_OPTIONS}
        placeholder="Value"
        size={size}
        value={value}
      />
    );
  }
  if (family === 'number') {
    return (
      <DraftInputNumber
        aria-label="Value"
        className="lf-filter-value"
        onChange={onChange}
        placeholder="Value"
        size={size}
        value={value}
      />
    );
  }
  if (family === 'date') {
    return (
      <DatePicker
        aria-label="Value"
        className="lf-filter-value"
        onChange={(date) =>
          onChange(
            formatFilterDate({ column, date, edge: op === 'after' ? 'end' : 'start' }) ?? undefined
          )
        }
        size={size}
        value={parseFilterDate(value)}
      />
    );
  }
  return (
    <DraftInput
      aria-label="Value"
      className="lf-filter-value"
      onChange={onChange}
      placeholder="Value"
      size={size}
      value={value}
    />
  );
}

export default ValueEditor;
