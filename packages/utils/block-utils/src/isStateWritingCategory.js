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

// A block in one of these categories writes its blockId into page state: the
// engine's Block.isInput() is `input` or `input-container`, and Block.isList()
// holds the list's rows. The build's state-contract check and the engine must
// agree on this set, so it lives here rather than in either of them.
const STATE_WRITING_CATEGORIES = new Set(['input', 'input-container', 'list']);

function isStateWritingCategory(category) {
  return STATE_WRITING_CATEGORIES.has(category);
}

export { STATE_WRITING_CATEGORIES };

export default isStateWritingCategory;
