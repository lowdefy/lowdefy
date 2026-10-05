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

import { type } from '@lowdefy/helpers';

// The `months` calendar months ending at `anchor` (both `YYYY-MM`), oldest
// first. No anchor, no months: nothing has evidence to read.
function usageWindowMonths({ anchor, months }) {
  if (type.isNone(anchor)) return [];
  const [year, month] = anchor.split('-').map(Number);
  const window = [];
  for (let back = months - 1; back >= 0; back -= 1) {
    window.push(new Date(Date.UTC(year, month - 1 - back, 1)).toISOString().slice(0, 7));
  }
  return window;
}

export default usageWindowMonths;
