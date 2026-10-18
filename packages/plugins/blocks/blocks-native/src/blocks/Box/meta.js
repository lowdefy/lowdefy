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
  icons: [],
  valueType: null,
  slots: {
    content: 'Child blocks in the Box.',
  },
  cssKeys: {
    element: 'The Box element.',
  },
  events: {
    onClick: 'Trigger actions when the Box is pressed.',
    onSwipeLeft:
      'Mobile only. Trigger actions when the Box is swiped left: a drag across more than 40pt and more than twice as far across as down, or a quick flick. Vertical scrolls, and drags that start at the left edge of the screen (the iOS back gesture), are left to the page.',
    onSwipeRight:
      'Mobile only. Trigger actions when the Box is swiped right: a drag across more than 40pt and more than twice as far across as down, or a quick flick. Vertical scrolls, and drags that start at the left edge of the screen (the iOS back gesture), are left to the page.',
    onPaste:
      'Trigger actions when the element is focused and a paste event is triggered. Never fires on mobile.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      content: {
        type: 'string',
        description: 'Box content string. Overrides the "content" content area.',
      },
      swipeFeedback: {
        type: 'boolean',
        default: false,
        description:
          'Mobile only. Move the Box a little with the drag while it is swiped, on a rubber band, and spring it back on release. Needs `onSwipeLeft` or `onSwipeRight`.',
      },
    },
  },
};
