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

import createToggleRowExpanded from './createToggleRowExpanded.js';
import initExpanded from './initExpanded.js';

// Owns the `expanded` part of the value (row keys), shared by tree rows and expandable rows.
// The core writes `state.expanded` into the value.
const expansionFeature = {
  name: 'expansion',
  slices: {
    expanded: { init: initExpanded, cause: 'expand' },
  },
  actions: { toggleRowExpanded: createToggleRowExpanded },
};

export default expansionFeature;
