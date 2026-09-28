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

import sliceDefinitions from './sliceDefinitions.js';

// TanStack's controlled-state callbacks (onSortingChange, onColumnSizingChange, ...), each routed
// through updateSlice so a feature API call (column.toggleSorting, row.toggleSelected) commits the
// same way a Lowdefy-side update does.
function createSliceHandlers({ updateSlice }) {
  const handlers = {};
  Object.keys(sliceDefinitions).forEach((name) => {
    const option = `on${name.charAt(0).toUpperCase()}${name.slice(1)}Change`;
    handlers[option] = (updater) => updateSlice(name, updater);
  });
  return handlers;
}

export default createSliceHandlers;
