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

import getTagTone from '../getTagTone.js';
import isEmptyValue from '../isEmptyValue.js';
import resolveOption from '../resolveOption.js';
import EmptyCell from './EmptyCell.js';

function StatusCell({ value, row, column }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const option = resolveOption({ options: column.options, value });
  return (
    <span className="lf-table-status">
      <span
        className="lf-table-status-dot"
        style={{ '--lf-table-tone': getTagTone({ item: value, column, row }) }}
      />
      {option?.label ?? String(value)}
    </span>
  );
}

export default StatusCell;
