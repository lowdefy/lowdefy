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

// Which loading state a table is in (design D17), from Lowdefy's `loading` signal and the rows:
// - `initial`: loading with no rows yet: skeleton rows under the real header,
// - `refreshing`: rows on screen while loading or while a view change is pending: the rows stay
//   and a progress bar runs under the header,
// - `empty`: nothing to show and nothing loading ("No rows", or "No matching rows" when the view
//   filters every row out),
// - `ready`: rows, nothing loading.
// `sourceCount` counts the rows before the view filters them (the held rows while loading, see
// holdRows); `displayCount` what the body shows. A filter that hides every row is `empty`, never
// `initial`, since the rows are there.
function resolveLoadingState({ loading, pending = false, sourceCount, displayCount }) {
  if (displayCount > 0) return loading || pending ? 'refreshing' : 'ready';
  if (sourceCount === 0 && loading) return 'initial';
  return 'empty';
}

export default resolveLoadingState;
