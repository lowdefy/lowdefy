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
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';

function BooleanCell(params) {
  const { value, cellConfig } = params;
  if (type.isNone(value)) return <NullCell />;

  const truthy = Boolean(value);
  const label = truthy ? cellConfig?.trueLabel ?? 'Yes' : cellConfig?.falseLabel ?? 'No';
  const color = truthy
    ? cellConfig?.trueColor ?? 'var(--ant-color-success)'
    : cellConfig?.falseColor ?? 'var(--ant-color-text-quaternary)';

  return <span style={{ color, fontWeight: truthy ? 600 : 400 }}>{label}</span>;
}

export default BooleanCell;
