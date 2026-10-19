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
import { Button, Checkbox, Input } from 'antd';

// A searchable checklist of a column's values; the checked values filter with `in`.
function OptionsFilter({ options, selected, onChange }) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const visible = term
    ? options.filter((option) => option.label.toLowerCase().includes(term))
    : options;
  const checked = new Set(selected);

  function toggle(value) {
    if (checked.has(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="lf-filter-options" data-lf-filter-options="">
      <Input
        allowClear
        aria-label="Search values"
        autoFocus
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search values"
        size="small"
        value={search}
      />
      <div className="lf-filter-options-actions">
        <Button
          onClick={() => onChange([...new Set([...selected, ...visible.map((o) => o.value)])])}
          size="small"
          type="link"
        >
          Select all
        </Button>
        <Button
          disabled={selected.length === 0}
          onClick={() => onChange([])}
          size="small"
          type="link"
        >
          Clear
        </Button>
      </div>
      <div className="lf-filter-options-list" role="group">
        {visible.map((option) => (
          <Checkbox
            checked={checked.has(option.value)}
            data-value={String(option.value)}
            key={String(option.value)}
            onChange={() => toggle(option.value)}
          >
            {option.label}
          </Checkbox>
        ))}
        {visible.length === 0 ? <div className="lf-filter-options-empty">No values</div> : null}
      </div>
    </div>
  );
}

export default OptionsFilter;
