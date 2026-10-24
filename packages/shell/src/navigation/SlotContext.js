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

import { createContext } from 'react';

// The index of the frame group (app/(t0,t1,t2,t3,t4)) a screen lives in, which its group layout
// provides from the segment Expo Router gives it. A screen cannot read it from useSegments: those
// are the focused route's, so every tab rendered at once would take the focused tab's index.
const SlotContext = createContext(0);

export default SlotContext;
