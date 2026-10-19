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

const LIST_INDEX_PATTERN = /\.\d+(?=\.|$)/g;

// A block inside a List renders once per item, with the item's index in its
// id (`rows.0.label`), while config names it with `$` (`rows.$.label`). The
// compiler's step identity, the exercised path and the lints all compare ids
// in the config form, so they line up with each other and with mutant anchors.
function normaliseBlockId(blockId) {
  return blockId.replace(LIST_INDEX_PATTERN, '.$');
}

export default normaliseBlockId;
