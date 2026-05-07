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
    element: 'The DiffGit wrapper element.',
    title: 'The DiffGit title.',
    group: 'The pre element containing the unified diff output.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      before: {
        description:
          'Previous state. Rendered as stable-sorted YAML; null / undefined serialises to an empty string.',
        docs: { displayType: 'yaml' },
        oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'null' }],
      },
      after: {
        description:
          'New state. Rendered as stable-sorted YAML; null / undefined serialises to an empty string.',
        docs: { displayType: 'yaml' },
        oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'null' }],
      },
      title: {
        type: 'string',
        description: 'Optional title rendered above the patch. Supports html.',
      },
      emptyText: {
        type: 'string',
        default: 'No changes',
        description: 'Unused by DiffGit — the renderer always emits its YAML patch output.',
      },
      hide: {
        type: 'array',
        description:
          'Patterns to strip before serialising to YAML. Each entry is an exact dotted path (e.g. `user.email`), a `prefix.*` prefix match, or a `*.leaf` tail match.',
        items: { type: 'string' },
      },
      show: {
        type: 'array',
        description:
          'Allowlist of paths to keep. Same pattern syntax as `hide`. Applied before `hide`.',
        items: { type: 'string' },
      },
      theme: {
        type: 'object',
        description:
          'Antd Descriptions design token overrides. See <a href="https://ant.design/components/descriptions#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/descriptions#design-token',
        },
      },
    },
  },
};
