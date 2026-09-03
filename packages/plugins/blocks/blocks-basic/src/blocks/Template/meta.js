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
  // Slot names are declared by the template's {% slot %} tags, so the meta cannot enumerate them.
  slots: false,
  cssKeys: {
    element: 'The Template element.',
  },
  hazards: [
    {
      id: 'template-safe-filter-unescaped',
      kind: 'semantics',
      message:
        'Every {{ value }} is HTML-escaped. The "| safe" filter turns escaping off for that value, so never apply it to caller-supplied or database strings - only to markup the app itself produced.',
      see: 'container-blocks/template',
    },
    {
      id: 'template-css-is-text',
      kind: 'semantics',
      message:
        'properties.css is CSS text scoped to this block (nested under [id="bl-<blockId>"]). Braces must balance - a stray "}" would escape the scope and is rejected. The style key stays an object of CSS properties per cssKey; a <style> tag inside the template is stripped.',
      see: 'container-blocks/template',
    },
  ],
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      template: {
        type: 'string',
        description:
          'Nunjucks template source. {{ value }} is escaped, {{ value | safe }} is not, and {% slot "name" %} places the blocks configured under slots.name.',
        docs: {
          displayType: 'text-area',
        },
      },
      context: {
        description:
          'Values available to the template. Objects are spread into the template scope; a primitive is available as "value".',
        docs: {
          displayType: 'yaml',
        },
      },
      css: {
        type: 'string',
        description:
          'CSS text applied to this block only. Rules are nested under the block wrapper selector, so ".row { ... }" styles only .row elements inside this block.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
