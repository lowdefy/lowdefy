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

function tagStyle(resolved) {
  return {
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
}

function TagCell(params) {
  const { value, data, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }

  const { colorMap, colorFrom, default: defaultColor } = cellConfig ?? {};
  const useColorFrom = type.isString(colorFrom);
  const fromColor = useColorFrom ? resolvePath(colorFrom, data) : undefined;

  function colorFor(item) {
    if (useColorFrom) return fromColor;
    if (type.isObject(colorMap)) return colorMap[item];
    return undefined;
  }

  if (type.isArray(value)) {
    const items = value.filter((item) => !type.isNone(item) && item !== '');
    if (items.length === 0) {
      return <NullCell />;
    }
    const containerStyle = { display: 'inline-flex', flexWrap: 'wrap', gap: 4 };
    return (
      <span style={containerStyle}>
        {items.map((item, index) => {
          const resolved = resolveColor(colorFor(item) ?? defaultColor);
          return (
            <span key={`${index}-${item}`} style={tagStyle(resolved)}>
              {String(item)}
            </span>
          );
        })}
      </span>
    );
  }

  const resolved = resolveColor(colorFor(value) ?? defaultColor);
  return <span style={tagStyle(resolved)}>{String(value)}</span>;
}

export default TagCell;
