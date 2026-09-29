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
import { InputNumber, Select, Space } from 'antd';

import defaultRelativeDate from './defaultRelativeDate.js';

const DIRECTIONS = [
  { value: 'last', label: 'Last' },
  { value: 'next', label: 'Next' },
];

const UNITS = [
  { value: 'day', label: 'days' },
  { value: 'week', label: 'weeks' },
  { value: 'month', label: 'months' },
  { value: 'year', label: 'years' },
];

// `within` values: `{ last: n, unit }` or `{ next: n, unit }`, resolved against today where the
// filter runs, so a saved "last 30 days" view keeps meaning the last 30 days.
function RelativeDateEditor({ value, onChange, size }) {
  const current = value ?? defaultRelativeDate;
  const direction = typeof current.next === 'number' ? 'next' : 'last';
  const amount = current[direction];
  return (
    <Space.Compact className="lf-filter-relative" data-lf-relative-date="" size={size}>
      <Select
        aria-label="Direction"
        onChange={(next) => onChange({ [next]: amount, unit: current.unit })}
        options={DIRECTIONS}
        popupMatchSelectWidth={false}
        value={direction}
      />
      <InputNumber
        aria-label="Amount"
        min={1}
        onChange={(next) => {
          if (typeof next === 'number') onChange({ [direction]: next, unit: current.unit });
        }}
        precision={0}
        style={{ width: 72 }}
        value={amount}
      />
      <Select
        aria-label="Unit"
        onChange={(unit) => onChange({ [direction]: amount, unit })}
        options={UNITS}
        popupMatchSelectWidth={false}
        value={current.unit}
      />
    </Space.Compact>
  );
}

export default RelativeDateEditor;
