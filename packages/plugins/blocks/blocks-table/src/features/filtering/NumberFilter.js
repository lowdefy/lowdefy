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

import DraftInputNumber from './DraftInputNumber.js';

function NumberFilter({ state, onChange }) {
  return (
    <div className="lf-filter-simple lf-filter-range">
      <DraftInputNumber
        aria-label="Minimum"
        autoFocus
        onChange={(min) => onChange({ ...state, min: min ?? null })}
        placeholder="Min"
        size="small"
        value={state.min}
      />
      <span className="lf-filter-range-dash">–</span>
      <DraftInputNumber
        aria-label="Maximum"
        onChange={(max) => onChange({ ...state, max: max ?? null })}
        placeholder="Max"
        size="small"
        value={state.max}
      />
    </div>
  );
}

export default NumberFilter;
