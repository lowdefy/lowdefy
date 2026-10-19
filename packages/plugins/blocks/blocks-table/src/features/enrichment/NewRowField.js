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
import { Input, InputNumber, Select, Switch } from 'antd';

import createValueSpec from './createValueSpec.js';

function selectOptions(column) {
  return (column.options ?? []).map((option) => ({ value: option.value, label: option.label }));
}

// One field of the new-row editor: the control of the column's editor kind (text, number,
// switch, select, multi select; dates are typed as text and parsed on commit).
function NewRowField({ autoFocus, column, disabled, onChange, value }) {
  const spec = createValueSpec(column);
  switch (spec.kind) {
    case 'number':
    case 'rating':
      return (
        <InputNumber
          aria-label={column.title}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={onChange}
          size="small"
          value={value ?? null}
        />
      );
    case 'boolean':
      return (
        <Switch
          aria-label={column.title}
          autoFocus={autoFocus}
          checked={value === true}
          disabled={disabled}
          onChange={onChange}
          size="small"
        />
      );
    case 'select':
    case 'multiSelect':
      if (!column.options) break;
      return (
        <Select
          allowClear
          aria-label={column.title}
          autoFocus={autoFocus}
          disabled={disabled}
          mode={spec.kind === 'multiSelect' ? 'multiple' : undefined}
          onChange={onChange}
          options={selectOptions(column)}
          popupMatchSelectWidth={false}
          size="small"
          value={value ?? undefined}
        />
      );
    default:
      break;
  }
  return (
    <Input
      aria-label={column.title}
      autoFocus={autoFocus}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={spec.kind === 'date' || spec.kind === 'datetime' ? 'YYYY-MM-DD' : undefined}
      size="small"
      value={value ?? ''}
    />
  );
}

export default NewRowField;
