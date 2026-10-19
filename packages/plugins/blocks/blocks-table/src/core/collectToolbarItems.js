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

// Components features add to the end of the toolbar, before the `toolbarEnd` slot, from their
// `toolbarItems` (enrichment's CSV import button). Each receives `{ api }` and returns null when
// it has nothing to show.
function collectToolbarItems(features) {
  return features.flatMap((feature) => feature.toolbarItems ?? []);
}

export default collectToolbarItems;
