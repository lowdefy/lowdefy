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

const DEFAULT_THRESHOLDS = [20, 40, 60, 80];
const DEFAULT_COLORS = [
  'var(--ant-color-error)',
  'var(--ant-color-warning)',
  'var(--ant-color-gold, var(--ant-color-warning))',
  'var(--ant-color-info)',
  'var(--ant-color-success)',
];

function pickColor(value, thresholds, colors) {
  for (let i = 0; i < thresholds.length; i += 1) {
    if (value < thresholds[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

function ProgressCell(params) {
  const { value, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell placeholder={cellConfig?.nullLabel ?? 'None'} />;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return <NullCell />;
  }
  const thresholds = type.isArray(cellConfig?.thresholds)
    ? cellConfig.thresholds
    : DEFAULT_THRESHOLDS;
  const colors = type.isArray(cellConfig?.colors) ? cellConfig.colors : DEFAULT_COLORS;
  const color = pickColor(num, thresholds, colors);
  const suffix = cellConfig?.suffix ?? '%';

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--ant-padding-xxs, 4px) var(--ant-padding-xs, 8px)',
    borderRadius: 'var(--ant-border-radius-sm, 4px)',
    fontSize: 'var(--ant-font-size-sm, 12px)',
    fontWeight: 600,
    lineHeight: 1,
    color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
  };

  return (
    <span style={style}>
      {num}
      {suffix}
    </span>
  );
}

export default ProgressCell;
