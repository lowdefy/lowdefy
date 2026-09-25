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
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';

const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm';

function DateCell(params) {
  const { value, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }
  const text = formatDate({
    value,
    format: cellConfig?.format ?? DEFAULT_FORMAT,
    relative: cellConfig?.relative,
  });
  if (text === null) {
    return <NullCell placeholder="—" />;
  }
  return <span>{text}</span>;
}

export default DateCell;
