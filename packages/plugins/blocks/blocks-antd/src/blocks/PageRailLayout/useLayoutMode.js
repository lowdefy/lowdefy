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

import { useEffect, useState } from 'react';

import getLayoutMode from './getLayoutMode.js';
import getLayoutQueries from './getLayoutQueries.js';

function browserMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? (query) => window.matchMedia(query)
    : undefined;
}

// desktop, tablet or phone. Read once before the first paint, then on media query changes only,
// so resizing a window does not re-render the page on every pixel.
function useLayoutMode({ drawerBreakpoint, mobileBreakpoint }) {
  const [mode, setMode] = useState(() =>
    getLayoutMode({ drawerBreakpoint, mobileBreakpoint, matchMedia: browserMatchMedia() })
  );
  useEffect(() => {
    const matchMedia = browserMatchMedia();
    if (!matchMedia) return undefined;
    const update = () => setMode(getLayoutMode({ drawerBreakpoint, mobileBreakpoint, matchMedia }));
    const lists = Object.values(getLayoutQueries({ drawerBreakpoint, mobileBreakpoint })).map(
      matchMedia
    );
    lists.forEach((list) => list.addEventListener?.('change', update));
    update();
    return () => lists.forEach((list) => list.removeEventListener?.('change', update));
  }, [drawerBreakpoint, mobileBreakpoint]);
  return mode;
}

export default useLayoutMode;
