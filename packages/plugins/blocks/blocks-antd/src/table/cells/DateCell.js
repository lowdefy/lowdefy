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
import formatDate from '@lowdefy/block-utils/format/formatDate.js';

import DATE_FORMATS from '../dateFormats.js';
import isEmptyValue from '../isEmptyValue.js';
import EmptyCell from './EmptyCell.js';

function DateCell({ value, column }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const format = column.cell.format ?? DATE_FORMATS[column.type];
  if (column.cell.relative === true) {
    const text = formatDate({ value, relative: true });
    if (text === null) return <EmptyCell />;
    // A relative date keeps the exact date one hover away.
    return <span title={formatDate({ value, format })}>{text}</span>;
  }
  const text = formatDate({ value, format });
  if (text === null) return <EmptyCell />;
  return text;
}

export default DateCell;
