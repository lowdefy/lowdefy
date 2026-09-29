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

// Grid-level: every change of the rendered range (or of the display list under it) goes to the
// store, which loads the blocks behind it, at once while scrolling slowly or once the range
// settles after a fast scroll.
function useServerRange({ api, range, rows }) {
  const store = api.serverStore;
  useEffect(() => {
    if (!store) return;
    store.onRange({ rowStart: range.rowStart, rowEnd: range.rowEnd });
  }, [store, range.rowStart, range.rowEnd, rows]);
  return null;
}

export default useServerRange;
