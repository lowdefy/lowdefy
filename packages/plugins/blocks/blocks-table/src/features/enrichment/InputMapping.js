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
import { Input, Select } from 'antd';

const LITERAL = '__value';

// A provider input's source in the picker: a column of the table, or a literal value typed in.
function InputMapping({ columns, input, mapping, onChange }) {
  const literal = mapping?.mode === 'value';
  const options = [
    ...columns.map((column) => ({ value: column.key, label: column.title })),
    { value: LITERAL, label: 'Literal value…' },
  ];
  return (
    <div className="lf-enrich-input-map" data-lf-picker-input={input.key}>
      <span className="lf-enrich-field-label">
        {input.title ?? input.key}
        {input.required ? <span className="lf-enrich-required"> *</span> : null}
      </span>
      <Select
        allowClear
        aria-label={`${input.title ?? input.key} source`}
        onChange={(next) => {
          if (next === LITERAL) onChange({ mode: 'value', value: '' });
          else onChange({ mode: 'column', column: next ?? '' });
        }}
        options={options}
        placeholder="Choose a column"
        value={literal ? LITERAL : mapping?.column || undefined}
      />
      {literal ? (
        <Input
          aria-label={`${input.title ?? input.key} value`}
          data-lf-picker-literal={input.key}
          onChange={(event) => onChange({ mode: 'value', value: event.target.value })}
          value={mapping.value ?? ''}
        />
      ) : null}
    </div>
  );
}

export default InputMapping;
