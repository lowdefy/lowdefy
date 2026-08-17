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

import { type } from '@lowdefy/helpers';

import { isBlank } from '../../static.utils.js';

/**
 * Title → `heading`. `properties.level` selects the heading size (1–4);
 * antd's level 5 clamps to 4, the smallest the IR renders. Empty content
 * yields no node.
 */
export const Title = {
  toReport: ({ block }) => {
    const { content, level } = block.properties;
    if (isBlank(content)) return null;
    const requested = type.isNumber(level) ? Math.round(level) : 4;
    const clamped = Math.min(Math.max(requested, 1), 4);
    return { kind: 'heading', text: String(content), level: clamped };
  },
};
