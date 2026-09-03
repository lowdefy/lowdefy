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
      id: 'html-deprecated-use-template',
      kind: 'semantics',
      message:
        'Html is deprecated. Use the Template block: it escapes every value by default (Html renders a string that is only sanitised afterwards), it takes a context of values instead of one concatenated string, and {% slot "name" %} places real Lowdefy blocks inside the markup.',
      see: 'container-blocks/template',
    },
    {
      id: 'html-style-stripped',
      kind: 'semantics',
      message:
        'Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed before render. Use DangerousHtml for a trusted <style> block, or style the block through its style and class properties.',
      see: 'display-blocks/html',
    },
  ],
  events: {
    onTextSelection: {
      description: 'Trigger action when text is selected.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          selection: { type: 'string', description: 'The selected text.' },
        },
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      html: {
        type: 'string',
        description:
          'Content to be rendered as Html. Deprecated - use the Template block, which escapes values by default and supports slots.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
