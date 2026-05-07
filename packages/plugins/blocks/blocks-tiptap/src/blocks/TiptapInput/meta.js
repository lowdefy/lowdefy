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
  category: 'input',
  icons: [],
  valueType: 'object',
  initValue: {
    html: null,
    text: null,
    markdown: null,
    fileList: [],
  },
  events: {
    onChange: 'Trigger action when the editor content is changed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowedMimeTypes: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Mime-types accepted by the drag/drop and paste file handler. Defaults to common image types (jpeg, png, gif, webp). Only used when s3PostPolicyRequestId is set.',
      },
      autoSize: {
        oneOf: [
          {
            type: 'boolean',
            default: false,
            description: 'When true the editor grows with its content and has no max height.',
          },
          {
            type: 'object',
            description: 'Constrain the editor height with a minimum and/or maximum row count.',
            properties: {
              minRows: {
                type: 'integer',
                minimum: 1,
                description: 'Minimum visible rows before content overflows.',
              },
              maxRows: {
                type: 'integer',
                minimum: 1,
                description: 'Maximum visible rows; beyond this the editor scrolls vertically.',
              },
            },
          },
        ],
        description:
          'Either a boolean (true to auto-grow without a cap) or an object with minRows/maxRows. Ignored when `rows` is set.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Whether the editor renders with a border.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Render the editor as read-only.',
      },
      highlight: {
        type: 'object',
        description: 'Text highlight extension settings.',
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the Highlight extension and its bubble-menu color swatches.',
          },
          multicolor: {
            type: 'boolean',
            default: true,
            description: 'Allow highlights to carry a color value. Disable for single-color.',
          },
        },
      },
      image: {
        type: 'object',
        description: 'Image extension settings.',
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the Image extension.',
          },
          maxWidth: {
            type: 'string',
            default: '80%',
            description: 'Inline CSS max-width applied to inserted images.',
          },
          zoom: {
            type: 'number',
            default: 0.5,
            description: 'Inline CSS zoom factor applied to inserted images.',
          },
        },
      },
      inputStyle: {
        type: 'object',
        description: 'Inline style applied to the editable area of the editor.',
        docs: { displayType: 'yaml' },
      },
      label: {
        type: 'object',
        description: 'Label configuration forwarded to the Lowdefy Label block.',
        docs: { displayType: 'yaml' },
      },
      link: {
        type: 'object',
        description: 'Link extension settings.',
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the Link extension.',
          },
          autolink: {
            type: 'boolean',
            default: true,
            description: 'Auto-convert URLs typed in the editor to links.',
          },
          linkOnPaste: {
            type: 'boolean',
            default: true,
            description: 'Convert pasted URLs to links.',
          },
          openOnClick: {
            type: 'boolean',
            default: true,
            description: 'Open links in a new tab when clicked in view mode.',
          },
          defaultProtocol: {
            type: 'string',
            default: 'https',
            description: 'Protocol prefixed to URLs that omit one (e.g. "https").',
          },
        },
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder shown when the editor is empty.',
      },
      rows: {
        type: 'integer',
        minimum: 1,
        description:
          'Fix the editor height to exactly this many rows. Takes precedence over autoSize.',
      },
      s3PostPolicyRequestId: {
        type: 'string',
        description:
          'Id of a request that returns an S3 presigned POST policy. When set, images dragged or pasted into the editor are uploaded via that policy and inserted as <img> nodes. Leave unset to disable image uploads.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        description: 'Label size forwarded to the Label block.',
      },
      starterKit: {
        type: 'object',
        description:
          'Options forwarded to TipTap StarterKit (https://tiptap.dev/docs/editor/extensions/functionality/starterkit). Use this to disable bundled extensions (e.g. {heading: false, codeBlock: false}).',
        docs: { displayType: 'yaml' },
      },
      table: {
        type: 'object',
        description: 'Table extension settings.',
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the Table extension and its row/header/cell nodes.',
          },
          resizable: {
            type: 'boolean',
            default: true,
            description: 'Allow column resizing with a drag handle.',
          },
        },
      },
      title: {
        type: 'string',
        description: 'Label title shown above the editor.',
      },
    },
  },
};
