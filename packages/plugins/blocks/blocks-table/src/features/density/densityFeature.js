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

import densityToValue from './densityToValue.js';
import initDensity from './initDensity.js';
import initWrap from './initWrap.js';

// `view.density` (compact | default | comfortable): the row height when `rowHeight` is not set.
// `view.wrap`: text-like columns wrap (getViewWrapColumn, applied to the layout columns). Slices,
// so the toolbar's density and Wrap toggles are ordinary committed changes.
const densityFeature = {
  name: 'density',
  viewKeys: ['density', 'wrap'],
  slices: {
    density: { init: initDensity, cause: 'density' },
    wrap: { init: initWrap, cause: 'wrap' },
  },
  toValue: densityToValue,
};

export default densityFeature;
