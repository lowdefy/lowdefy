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

import { useContext } from 'react';

import ScreenContext from './ScreenContext.js';

/**
 * Whether the screen a block is drawn on is the one shown (the shell router's focus): false on a
 * tab not picked and under a screen pushed over it. For a block that runs something only while it
 * can be seen, such as a looping animation. True outside a screen.
 *
 * @returns {boolean}
 */
function useScreenFocused() {
  return useContext(ScreenContext).focused;
}

export default useScreenFocused;
