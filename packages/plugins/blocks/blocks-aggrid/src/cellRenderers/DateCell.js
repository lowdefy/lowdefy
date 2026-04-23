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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';

dayjs.extend(relativeTime);

const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm';

function DateCell(params) {
  const { value, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }
  const d = dayjs(value);
  if (!d.isValid()) {
    return <NullCell placeholder="—" />;
  }
  const text = cellConfig?.relative ? d.fromNow() : d.format(cellConfig?.format ?? DEFAULT_FORMAT);
  return <span>{text}</span>;
}

export default DateCell;
