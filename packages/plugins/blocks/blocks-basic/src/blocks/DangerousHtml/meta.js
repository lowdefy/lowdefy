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
    element: 'The DangerousHtml element.',
  },
  hazards: [
    {
      id: 'dangerous-html-unsanitised',
      message:
        'Content is rendered without sanitising, so never pass caller-supplied or database HTML through it. Use Html for anything a user could have written.',
      see: 'display-blocks/dangeroushtml',
    },
    {
      id: 'dompurify-options-first-render',
      message:
        'DOMPurifyOptions is read once when the block mounts, so a value that changes after the first render has no effect. Set it statically or remount the block.',
      see: 'display-blocks/dangeroushtml',
    },
  ],
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
      DOMPurifyOptions: {
        type: 'object',
        description:
          'Customize DOMPurify options. Options are only applied when the block is mounted, thus any parsed settings is only applied at first render.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
