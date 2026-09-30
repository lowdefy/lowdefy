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

import { useEffect } from 'react';

const SETTLE_MS = 150;

// Grid-level: running cells' spinners are CSS animations, and a handful of them animating inside
// a scrolling grid costs frames (the scroll bench drops frames with them, none without). While
// the grid scrolls the scroller carries `data-scrolling`, which pauses them, and it clears once
// the scroll has settled for 150 ms. Only tables with enrichment or ai columns listen.
function usePauseWhileScrolling({ config, scrollerRef }) {
  const active = config.enrichment.runColumns.length > 0;
  useEffect(() => {
    const element = scrollerRef.current;
    if (!active || !element) return undefined;
    let timer = 0;
    function settle() {
      timer = 0;
      delete element.dataset.scrolling;
    }
    function onScroll() {
      if (timer) clearTimeout(timer);
      else element.dataset.scrolling = '';
      timer = setTimeout(settle, SETTLE_MS);
    }
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [active]);
  return null;
}

export default usePauseWhileScrolling;
