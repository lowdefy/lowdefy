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

import densityHeights from '../../core/densityHeights.js';

const DEFAULT_MAX_HEIGHT = 600;

function estimateHeight(properties) {
  if (!type.isNone(properties.height)) return properties.height;
  const rows = type.isArray(properties.data) ? properties.data.length : 0;
  const rowHeight =
    properties.rowHeight ?? densityHeights[properties.size] ?? densityHeights.default;
  const content = densityHeights.default + Math.max(rows, 3) * rowHeight;
  return Math.min(content, properties.maxHeight ?? DEFAULT_MAX_HEIGHT);
}

function TableFallback({ blockId, properties }) {
  return <div id={blockId} style={{ height: estimateHeight(properties), width: '100%' }} />;
}

export default TableFallback;
