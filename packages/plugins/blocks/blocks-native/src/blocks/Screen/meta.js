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

// The mobile page type. Its component lives in @lowdefy/client-native, which owns how a page meets
// the shell's router; this meta lets the build accept mobile pages of type Screen.
export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'The page content, in a scroll view.',
    headerRight: 'Blocks drawn at the right of the screen header.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'The screen title, shown in the header.',
      },
      presentation: {
        type: 'string',
        enum: ['card', 'modal', 'sheet'],
        default: 'card',
        description: 'How the screen is presented when opened.',
      },
    },
  },
};
