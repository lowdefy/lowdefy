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

// How deep the list being drawn sits: 0 at the top, 1 in a list item, and so on. A list reads it
// to pick its markers and gives its items one more.
const ListDepthContext = createContext(0);

// The list item being drawn, which a task box in its text tells that it is a task, so the item
// draws the box where its marker goes. Null outside a list.
const ListItemContext = createContext(null);

export { ListDepthContext, ListItemContext };
