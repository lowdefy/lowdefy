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
import hasAreaKeys from './hasAreaKeys.js';
import hasLayoutKeys from './hasLayoutKeys.js';

// Whether a container slot renders its `lf-row` Area, given the slot's config,
// the layouts of the blocks in it, and the class and style the caller asked for.
//
// A column needs its row: `lf-col` sizes itself as a flex item of `lf-row`, so
// the moment any block in the slot is laid out, every block in the slot is
// wrapped and the Area is rendered to hold them. The class and style arguments
// also force the Area - they have nowhere else to land, which is what keeps
// `content.<slot>(style)` working for the blocks that pass one.
function areaIsRendered({ area, areaKey, blockLayouts = [], className, layout, style }) {
  if (hasAreaKeys({ area, areaKey, layout })) return true;
  if (!type.isNone(className) && className !== '') return true;
  if (type.isObject(style) && Object.keys(style).length > 0) return true;
  return blockLayouts.some(hasLayoutKeys);
}

export default areaIsRendered;
