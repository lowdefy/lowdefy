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

import claimedViewKeys from './claimedViewKeys.js';
import densityHeights from './densityHeights.js';
import pickViewPart from './pickViewPart.js';
import resolveViewColumns from './resolveViewColumns.js';
import sliceDefinitions from './sliceDefinitions.js';

function passthroughView({ value, defaultView }) {
  const keys = new Set([...Object.keys(defaultView ?? {}), ...Object.keys(value?.view ?? {})]);
  const view = {};
  keys.forEach((key) => {
    if (claimedViewKeys.has(key)) return;
    const part = pickViewPart({ value, defaultView, key });
    if (!type.isUndefined(part)) view[key] = part;
  });
  return view;
}

// Builds the whole table state from a block value: each feature slice resolves its own part of the
// value with the brief's fallback rules (value, then defaultView, then column defaults).
function createInitialState({ value, config, rows }) {
  const { defaultView } = config;
  const viewColumns = resolveViewColumns({ value, defaultView, columns: config.columns });
  const args = { value, defaultView, config, viewColumns, rows, getKey: config.getKey };
  const state = {};
  Object.entries(sliceDefinitions).forEach(([name, definition]) => {
    state[name] = definition.init(args);
  });
  const density = pickViewPart({ value, defaultView, key: 'density' });
  // `size` is the density the view starts from (TableLight's `size`, the same names).
  state.density = type.isUndefined(densityHeights[density]) ? config.defaultDensity : density;
  state.viewPassthrough = passthroughView({ value, defaultView });
  state.expanded = type.isArray(value?.expanded) ? value.expanded : [];
  return state;
}

export default createInitialState;
