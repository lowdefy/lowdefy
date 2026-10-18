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

import React from 'react';

// What a page's screen tells the Screen block, from LowdefyPage:
// - focused: whether the screen is the one shown (the shell's router focus), for onFocus.
// - setRefresh: sets the function pull-to-refresh runs on the page's scroll view (a function
//   that returns a promise; the spinner shows until it settles), or null for none.
// - footer: the store a Screen sets its footer slot in, which the page draws below its scroll
//   view (createFooterStore).
const ScreenContext = React.createContext({
  focused: true,
  footer: { get: () => null, set: () => undefined, subscribe: () => () => undefined },
  setRefresh: () => undefined,
});

export default ScreenContext;
