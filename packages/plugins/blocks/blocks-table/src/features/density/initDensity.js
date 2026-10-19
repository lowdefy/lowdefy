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

import densityHeights from '../../core/densityHeights.js';
import pickViewPart from '../../core/pickViewPart.js';

// The view's density, else the one `size` sets (TableLight's `size`, the same names).
function initDensity({ value, defaultView, config }) {
  const density = pickViewPart({ value, defaultView, key: 'density' });
  return type.isUndefined(densityHeights[density]) ? config.defaultDensity : density;
}

export default initDensity;
