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

import { useState } from 'react';

// Which column's header menu is open. `pressedOpen` is set by the menu button's pointerdown
// (see handleHeaderButtonPointerDown) and read by the click that follows it.
function useHeaderMenuState({ api }) {
  const [openKey, setOpenKey] = useState(null);
  api.headerMenu = { openKey, setOpenKey, pressedOpen: api.headerMenu?.pressedOpen ?? null };
  return null;
}

export default useHeaderMenuState;
