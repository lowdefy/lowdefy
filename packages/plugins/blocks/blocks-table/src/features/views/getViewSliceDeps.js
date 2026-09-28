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

// Selection and expansion are not part of the view. Leaving them out of the dependencies keeps a
// click on a checkbox from re-deriving the view.
const NON_VIEW_SLICES = new Set(['rowSelection', 'selectionMode', 'expanded']);

// The state slices a view derives from, in a fixed order, for hook dependencies.
function getViewSliceDeps(state) {
  return Object.keys(state)
    .filter((name) => !NON_VIEW_SLICES.has(name))
    .map((name) => state[name]);
}

export default getViewSliceDeps;
