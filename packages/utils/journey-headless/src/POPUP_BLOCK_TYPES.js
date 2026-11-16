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

// Blocks whose content shows only while they are open: their component keeps the open state and
// registers setOpen and toggleOpen, which a headless page stands in for (registerBlockStandIns).
const POPUP_BLOCK_TYPES = new Set(['Drawer', 'Modal']);

export default POPUP_BLOCK_TYPES;
