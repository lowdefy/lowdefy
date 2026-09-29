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
import { Select } from 'antd';

import DraftInput from './DraftInput.js';
import getOperatorLabel from './getOperatorLabel.js';
import textFilterOperators from './textFilterOperators.js';

function TextFilter({ state, onChange }) {
  const needsValue = state.op !== 'empty' && state.op !== 'notEmpty';
  return (
    <div className="lf-filter-simple">
      <Select
        aria-label="Operator"
        onChange={(op) => onChange({ ...state, op })}
        options={textFilterOperators.map((op) => ({
          value: op,
          label: getOperatorLabel({ op, family: 'text' }),
        }))}
        size="small"
        value={state.op}
      />
      {needsValue ? (
        <DraftInput
          aria-label="Filter text"
          autoFocus
          onChange={(value) => onChange({ ...state, value })}
          placeholder="Text"
          size="small"
          value={state.value}
        />
      ) : null}
    </div>
  );
}

export default TextFilter;
