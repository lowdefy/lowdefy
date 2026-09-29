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

// Components features add to the bulk bar, before the `bulkActions` slot, from their
// `bulkItems` (enrichment's "Run selected"). Each receives `{ api }` and returns null when it
// has nothing to show.
function collectBulkItems(features) {
  return features.flatMap((feature) => feature.bulkItems ?? []);
}

export default collectBulkItems;
