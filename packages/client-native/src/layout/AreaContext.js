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

// The area a block is placed in: its column gap and its container style. A gapped area is widened
// by its gap, and each of its blocks takes the gap as left padding (@lowdefy/layout-native
// childStyle); the container style says whether a block's placement is stretched or grown past its
// content (fillsPlacement). Outside an area (the page's root block) blocks stack in a column.
const AreaContext = React.createContext({ columnGap: 0, container: {} });

export default AreaContext;
