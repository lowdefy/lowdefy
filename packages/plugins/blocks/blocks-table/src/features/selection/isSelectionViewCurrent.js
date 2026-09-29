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

// Whether the view's filter and search are still the ones an `{ all: true }` selection was made
// with. Conditions are plain data; config markers (`~k`) are not enumerable.
function isSelectionViewCurrent({ state }) {
  const { selectionView } = state;
  if (selectionView === null) return true;
  return (
    JSON.stringify(selectionView.filter ?? null) === JSON.stringify(state.filter ?? null) &&
    (selectionView.search ?? null) === (state.search ?? null)
  );
}

export default isSelectionViewCurrent;
