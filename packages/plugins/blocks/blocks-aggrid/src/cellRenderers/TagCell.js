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
import resolveTagColor from '@lowdefy/block-utils/format/resolveTagColor.js';
import seededTagColor from '@lowdefy/block-utils/format/seededTagColor.js';
import tagStyle from '@lowdefy/block-utils/format/tagStyle.js';
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';
import { resolvePath } from './resolveFieldRefs.js';

function TagCell(params) {
  const { value, data, cellConfig } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }

  const { colorMap, colorFrom, default: defaultColor } = cellConfig ?? {};
  const useColorFrom = type.isString(colorFrom);
  const useColorMap = type.isObject(colorMap);
  const fromColor = useColorFrom ? resolvePath(colorFrom, data) : undefined;
  const seedingActive = !useColorFrom && !useColorMap && type.isNone(defaultColor);

  function colorFor(item) {
    if (useColorFrom) return fromColor;
    if (useColorMap) return colorMap[item];
    return undefined;
  }

  function pickColor(item) {
    return colorFor(item) ?? defaultColor ?? (seedingActive ? seededTagColor(item) : undefined);
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
          const resolved = resolveTagColor(pickColor(item));
          return (
            <span key={`${index}-${item}`} style={tagStyle(resolved)}>
              {String(item)}
            </span>
          );
        })}
      </span>
    );
  }

  const resolved = resolveTagColor(pickColor(value));
  return <span style={tagStyle(resolved)}>{String(value)}</span>;
}

export default TagCell;
