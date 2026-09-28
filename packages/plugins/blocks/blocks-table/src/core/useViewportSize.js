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

import { useLayoutEffect, useState } from 'react';

// The scroller's client size, for flex columns and the `virtual: auto` width rule. Only a real
// size change renders; scrolling never does.
function useViewportSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    function measure() {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height }
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return size;
}

export default useViewportSize;
