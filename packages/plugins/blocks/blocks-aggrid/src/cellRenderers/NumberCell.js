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
import formatNumber from '@lowdefy/block-utils/format/formatNumber.js';
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';

function signColor(num, cellConfig) {
  if (!cellConfig?.signColor) return cellConfig?.color;
  if (num > 0) return cellConfig?.positiveColor ?? 'var(--ant-color-success)';
  if (num < 0) return cellConfig?.negativeColor ?? 'var(--ant-color-error)';
  return cellConfig?.zeroColor ?? cellConfig?.color;
}

function NumberCell(params) {
  const { value, cellConfig } = params;
  if (type.isNone(value) || value === '') return <NullCell />;
  const num = Number(value);
  if (Number.isNaN(num)) return <NullCell />;

  const display = formatNumber({ value: num, config: cellConfig });

  const color = signColor(num, cellConfig);
  const style = color ? { color } : undefined;

  return <span style={style}>{display}</span>;
}

export default NumberCell;
