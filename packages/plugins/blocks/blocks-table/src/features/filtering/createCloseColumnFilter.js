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

import focusHeaderControl from '../headerMenu/focusHeaderControl.js';

// Action `closeColumnFilter({ restoreFocus })`: closes the popover; after Escape, focus returns to
// the column's menu button (or its header cell) so keyboard users stay where they were.
function createCloseColumnFilter(api) {
  return function closeColumnFilter({ restoreFocus } = {}) {
    const key = api.columnFilter.openKey;
    api.columnFilter.setOpenKey(null);
    if (restoreFocus && key !== null) focusHeaderControl({ api, key });
  };
}

export default createCloseColumnFilter;
