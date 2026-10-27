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

// True for blocks drawn in a screen header (a Screen's headerLeft and headerRight slots). A
// header item is as wide as its content: the native bar sizes its glass background to the item,
// so a block placed at its column width (span 24, the full width) would stretch the item across
// the header and push the title out.
const NaturalSizeContext = React.createContext(false);

export default NaturalSizeContext;
