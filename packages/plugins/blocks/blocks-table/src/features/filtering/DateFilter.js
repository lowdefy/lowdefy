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
import { DatePicker, Segmented } from 'antd';

import defaultRelativeDate from './defaultRelativeDate.js';
import formatFilterDate from './formatFilterDate.js';
import parseFilterDate from './parseFilterDate.js';
import RelativeDateEditor from './RelativeDateEditor.js';

const MODES = [
  { value: 'range', label: 'Range' },
  { value: 'relative', label: 'Relative' },
];

// A date range (either end open), or a relative period such as "within the last 7 days".
function DateFilter({ column, state, onChange }) {
  return (
    <div className="lf-filter-simple lf-filter-date">
      <Segmented
        block
        onChange={(mode) =>
          onChange(
            mode === 'relative'
              ? { mode, relative: state.relative ?? defaultRelativeDate }
              : { mode, from: null, to: null }
          )
        }
        options={MODES}
        size="small"
        value={state.mode}
      />
      {state.mode === 'relative' ? (
        <RelativeDateEditor
          onChange={(relative) => onChange({ mode: 'relative', relative })}
          size="small"
          value={state.relative}
        />
      ) : (
        <DatePicker.RangePicker
          allowEmpty={[true, true]}
          onChange={(dates) =>
            onChange({
              mode: 'range',
              from: formatFilterDate({ column, date: dates?.[0], edge: 'start' }),
              to: formatFilterDate({ column, date: dates?.[1], edge: 'end' }),
            })
          }
          size="small"
          value={[parseFilterDate(state.from), parseFilterDate(state.to)]}
        />
      )}
    </div>
  );
}

export default DateFilter;
