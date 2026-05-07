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
import { resolvePath } from './resolveFieldRefs.js';

const ANTD_TAG_COLOR_TOKENS = {
  red: 'var(--ant-color-error)',
  volcano: 'var(--ant-color-volcano, var(--ant-color-error))',
  orange: 'var(--ant-color-warning)',
  gold: 'var(--ant-color-gold, var(--ant-color-warning))',
  yellow: 'var(--ant-color-warning)',
  lime: 'var(--ant-color-lime, var(--ant-color-success))',
  green: 'var(--ant-color-success)',
  cyan: 'var(--ant-color-cyan, var(--ant-color-info))',
  blue: 'var(--ant-color-info)',
  geekblue: 'var(--ant-color-geekblue, var(--ant-color-info))',
  purple: 'var(--ant-color-purple, var(--ant-color-info))',
  magenta: 'var(--ant-color-magenta, var(--ant-color-error))',
  default: 'var(--ant-color-text-secondary)',
};

function resolveColor(value) {
  if (type.isNone(value)) return ANTD_TAG_COLOR_TOKENS.default;
  return ANTD_TAG_COLOR_TOKENS[value] ?? value;
}

function TagCell(params) {
  const { value, data, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }

  const { colorMap, colorFrom, default: defaultColor } = cellConfig ?? {};
  let color;
  if (type.isString(colorFrom)) {
    color = resolvePath(colorFrom, data);
  } else if (type.isObject(colorMap)) {
    color = colorMap[value];
  }
  const resolved = resolveColor(color ?? defaultColor);

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--ant-padding-xxs, 4px) var(--ant-padding-xs, 8px)',
    borderRadius: 'var(--ant-border-radius-sm, 4px)',
    fontSize: 'var(--ant-font-size-sm, 12px)',
    fontWeight: 600,
    lineHeight: 1,
    color: resolved,
    background: `color-mix(in srgb, ${resolved} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${resolved} 30%, transparent)`,
  };

  return <span style={style}>{String(value)}</span>;
}

export default TagCell;
