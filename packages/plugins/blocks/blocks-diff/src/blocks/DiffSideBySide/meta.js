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
    element: 'The DiffSideBySide wrapper element.',
    title: 'The DiffSideBySide title.',
    group: 'A paired Descriptions wrapper (one per side).',
    row: 'A single row label within either side.',
    tag: 'The change-type tag element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      before: {
        description:
          'Previous state. An object or array; null / undefined is treated as empty so "newly created" records diff cleanly.',
        docs: { displayType: 'yaml' },
        oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'null' }],
      },
      after: {
        description:
          'New state. An object or array; null / undefined is treated as empty so "deleted" records diff cleanly.',
        docs: { displayType: 'yaml' },
        oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'null' }],
      },
      maxDepth: {
        type: 'integer',
        default: 4,
        minimum: 1,
        description:
          'Paths deeper than this collapse into a single "Changed" row rendered as JSON. Defaults to 4.',
      },
      title: {
        type: 'string',
        description: 'Optional title rendered above the diff. Supports html.',
      },
      emptyText: {
        type: 'string',
        default: 'No changes',
        description: 'Shown when there are no differences between before and after.',
      },
      showUnchanged: {
        type: 'boolean',
        default: false,
        description: 'Also render unchanged leaf fields in a muted style in both columns.',
      },
      groupByRoot: {
        type: 'boolean',
        default: true,
        description:
          'Group changes by their top-level key. When false, changes render as one flat paired list.',
      },
      collapseNested: {
        type: 'boolean',
        default: true,
        description:
          'Render entirely-new or entirely-removed nested objects and arrays inside a collapsible panel.',
      },
      labels: {
        type: 'object',
        description:
          'Map of dotted path to display label. Example: { "user.email": "Email address" }.',
        docs: { displayType: 'yaml' },
        additionalProperties: { type: 'string' },
      },
      hide: {
        type: 'array',
        description:
          'Patterns to hide. Each entry is an exact dotted path (e.g. `user.email`), a `prefix.*` prefix match, or a `*.leaf` tail match.',
        items: { type: 'string' },
      },
      show: {
        type: 'array',
        description: 'Allowlist; same pattern syntax as `hide`. Applied before `hide`.',
        items: { type: 'string' },
      },
      format: {
        type: 'object',
        description:
          'Per-path value formatter. Keys are dotted paths (with optional "prefix.*" or "*.leaf" globs); values describe how to render matched values.',
        docs: { displayType: 'yaml' },
        additionalProperties: {
          type: 'object',
          required: ['type'],
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              enum: ['date', 'datetime', 'boolean', 'currency', 'json', 'code', 'enum'],
              description: 'Formatter type.',
            },
            pattern: { type: 'string', description: 'Dayjs format pattern.' },
            locale: { type: 'string', description: 'Intl locale (currency formatter).' },
            currency: { type: 'string', description: 'ISO 4217 currency code.' },
            yes: { type: 'string', default: 'Yes', description: 'Boolean truthy text.' },
            no: { type: 'string', default: 'No', description: 'Boolean falsy text.' },
            map: {
              type: 'object',
              description: 'Enum value map.',
              additionalProperties: {
                oneOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      label: { type: 'string' },
                      color: { type: 'string' },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      changeTypeLabels: {
        type: 'object',
        description: 'Override the tag labels for each change type.',
        additionalProperties: false,
        properties: {
          added: { type: 'string', default: 'Added' },
          removed: { type: 'string', default: 'Removed' },
          changed: { type: 'string', default: 'Changed' },
          unchanged: { type: 'string', default: 'Unchanged' },
        },
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
