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

export default {
  category: 'container',
  icons: ['X'],
  valueType: null,
  slots: {
    content: 'Blocks inside the sheet, in a scroll view.',
    headerRight:
      'Blocks at the right of the sheet header, such as a Save button. Replaces the close button.',
  },
  cssKeys: {
    element: 'The sheet content.',
    header: 'The sheet header.',
    title: 'The sheet title.',
    body: 'The scroll view content around the blocks.',
  },
  events: {
    onOpen: 'Trigger actions when the open method presents the sheet.',
    onClose:
      'Trigger actions when the sheet has been dismissed, by the close method, the close button or a swipe down.',
  },
  methods: {
    open: 'Present the sheet. Does nothing while it is open.',
    close: 'Dismiss the sheet.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      closable: {
        type: 'boolean',
        description:
          'Show a close button at the right of the header. Defaults to true when dragToDismiss is false, so the sheet can always be closed.',
      },
      detents: {
        type: 'string',
        enum: ['both', 'medium', 'large'],
        default: 'both',
        description:
          "The heights the sheet rests at. 'both' opens at medium (about half the screen) and can be dragged to large; 'medium' or 'large' keeps one height. Android opens a single detent at full height.",
      },
      dragToDismiss: {
        type: 'boolean',
        default: true,
        description:
          'Dismiss the sheet when it is swiped down or, on iOS, when the dimmed page behind it is tapped.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block, such as colorText, colorBgElevated or colorFillSecondary.',
      },
      title: {
        type: 'string',
        description: 'The title, centred in the sheet header.',
      },
    },
  },
};
