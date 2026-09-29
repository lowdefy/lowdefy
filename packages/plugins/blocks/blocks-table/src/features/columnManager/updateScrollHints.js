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

// Marks a scrolling list with `data-more-above` / `data-more-below` while entries are out of view
// that way; the list fades out at those edges (columnManager.css).
function updateScrollHints(list) {
  const above = list.scrollTop > 0.5;
  const below = list.scrollTop + list.clientHeight < list.scrollHeight - 0.5;
  list.toggleAttribute('data-more-above', above);
  list.toggleAttribute('data-more-below', below);
}

export default updateScrollHints;
