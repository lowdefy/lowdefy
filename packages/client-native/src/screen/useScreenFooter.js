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

import { useContext, useEffect } from 'react';

import ScreenContext from './ScreenContext.js';

/**
 * Draws a block's own chrome in its page's footer while the block is mounted: below the page's
 * scroll view, pinned above the tab bar and the keyboard on the bar material (ScreenFooter), as a
 * Screen's footer slot is. For a block whose control belongs there rather than in the scrolling
 * content, such as AgentChat's composer. A page uses this or its Screen's footer slot, not both.
 *
 * `render` is drawn in the footer's own tree, so state a component keeps there survives the
 * block's renders while its element type stays the same. It is set on every render of the block,
 * so the footer always draws the block's latest props; pass null to draw nothing.
 *
 * @param {(() => React.ReactNode)|null} render
 */
function useScreenFooter(render) {
  const { footer } = useContext(ScreenContext);
  useEffect(() => {
    footer.set(render);
  });
  useEffect(() => () => footer.set(null), [footer]);
}

export default useScreenFooter;
