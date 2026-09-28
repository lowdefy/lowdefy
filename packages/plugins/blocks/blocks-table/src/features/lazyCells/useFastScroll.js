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

// Faster than this the rows under the viewport change every frame: tier-1 cells wait.
const FAST_PX_PER_MS = 1.5;
const SETTLE_MS = 150;

// Marks the grid as fast scrolling while the scroll speed stays above FAST_PX_PER_MS, and clears
// it once the scroll has settled for SETTLE_MS (the react-virtuoso scroll-seek pattern).
function useFastScroll({ api, scrollerRef }) {
  useEffect(() => {
    const element = scrollerRef.current;
    const activity = api.cellActivity;
    let lastTop = element.scrollTop;
    let lastTime = performance.now();
    let timer = 0;
    function settle() {
      timer = 0;
      activity.set({ fastScrolling: false });
    }
    function onScroll() {
      const now = performance.now();
      const top = element.scrollTop;
      const speed = Math.abs(top - lastTop) / Math.max(1, now - lastTime);
      lastTop = top;
      lastTime = now;
      if (speed > FAST_PX_PER_MS) activity.set({ fastScrolling: true });
      if (!activity.state.fastScrolling) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, SETTLE_MS);
    }
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}

export default useFastScroll;
