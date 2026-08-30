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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Html element.',
  },
  hazards: [
    {
      id: 'html-style-stripped',
      message:
        'Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed before render. Use DangerousHtml for a trusted <style> block, or style the block through its style and class properties.',
      see: 'display-blocks/html',
    },
  ],
  events: {
    onTextSelection:
      'Trigger action when text is selected and pass selected text to the event object.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      html: {
        type: 'string',
        description: 'Content to be rendered as Html.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
