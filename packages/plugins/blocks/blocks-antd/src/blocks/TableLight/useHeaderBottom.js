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

// The bottom edge of antd's table header, relative to the block's element, while `active`: where
// the refreshing progress bar and the skeleton shimmer start. antd renders the header, so it is
// measured once each time the table starts loading, not on every render.
function useHeaderBottom({ ref, active }) {
  const [bottom, setBottom] = useState(null);
  useLayoutEffect(() => {
    if (!active || ref.current === null) return;
    const header = ref.current.querySelector('.ant-table-thead');
    if (header === null) return;
    const next = header.getBoundingClientRect().bottom - ref.current.getBoundingClientRect().top;
    setBottom((previous) => (previous === next ? previous : next));
  }, [active]);
  return bottom;
}

export default useHeaderBottom;
