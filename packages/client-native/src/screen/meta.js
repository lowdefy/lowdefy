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

// What the renderer reads of the Screen page type: its category and slots. Its properties schema,
// events and docs are @lowdefy/blocks-native's Screen meta, which the build reads.
const meta = {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'The page content, in a scroll view.',
    headerBottom:
      'Blocks pinned under the screen header (under the large title or the search field), which stay in view as the page scrolls.',
    headerLeft: 'Blocks drawn at the left of the screen header, at their natural size.',
    headerRight: 'Blocks drawn at the right of the screen header, at their natural size.',
    footer:
      'Blocks pinned to the bottom of the screen, outside the scroll view, above the tab bar and the keyboard.',
  },
};

export default meta;
