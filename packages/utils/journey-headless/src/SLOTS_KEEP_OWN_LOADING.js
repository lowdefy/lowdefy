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

// Blocks whose component passes its slots' blocks no loading, where every other container passes
// its own (the client's Container, List and InputContainer): blocks-table's Table renders each slot
// with `{ loading: false }` (renderSlot), so a button beside the rows stays usable while they load.
const SLOTS_KEEP_OWN_LOADING = new Set(['Table']);

export default SLOTS_KEEP_OWN_LOADING;
