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
    mentions: [],
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
          'Mime-types accepted by the drag/drop and paste file handler. Defaults to common image types. Only used when s3PostPolicyRequestId is set.',
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
              minRows: { type: 'integer', minimum: 1 },
              maxRows: { type: 'integer', minimum: 1 },
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
          disabled: { type: 'boolean', default: false },
          multicolor: { type: 'boolean', default: true },
        },
      },
      image: {
        type: 'object',
        description: 'Image extension settings.',
        additionalProperties: false,
        properties: {
          disabled: { type: 'boolean', default: false },
          maxWidth: { type: 'string', default: '80%' },
          zoom: { type: 'number', default: 0.6 },
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
          disabled: { type: 'boolean', default: false },
          autolink: { type: 'boolean', default: true },
          linkOnPaste: { type: 'boolean', default: true },
          openOnClick: { type: 'boolean', default: true },
          defaultProtocol: { type: 'string', default: 'https' },
        },
      },
      mentions: {
        type: 'object',
        description: 'Configure the set of mention targets and how they render.',
        additionalProperties: false,
        properties: {
          char: {
            type: 'string',
            default: '@',
            description:
              'Trigger character that opens the mention dropdown. Change to "#" for hashtags, etc.',
          },
          allowSpaces: {
            type: 'boolean',
            default: true,
            description: 'Allow spaces inside a mention query before it is committed.',
          },
          options: {
            type: 'array',
            description:
              'Array of mention items. Each item may be a string, or an object with a "label" (matched against user input) and a "value" (stored on the node).',
          },
          getHref: {
            type: 'object',
            description:
              'Optional function (_function operator) that receives a selected mention id and returns an href. When provided, mentions render as <a> tags.',
            docs: { displayType: 'yaml' },
          },
        },
      },
      mentionsRequestId: {
        type: 'string',
        description:
          'Id of a request used to populate mention options. When set, the block registers a __getTipTapMentions event that calls that request.',
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
          'Id of a request that returns an S3 presigned POST policy. When set, images dragged or pasted into the editor are uploaded via that policy.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        description: 'Label size forwarded to the Label block.',
      },
      starterKit: {
        type: 'object',
        description:
          'Options forwarded to TipTap StarterKit. Use to disable bundled extensions (e.g. {heading: false}).',
        docs: { displayType: 'yaml' },
      },
      table: {
        type: 'object',
        description: 'Table extension settings.',
        additionalProperties: false,
        properties: {
          disabled: { type: 'boolean', default: false },
          resizable: { type: 'boolean', default: true },
        },
      },
      title: {
        type: 'string',
        description: 'Label title shown above the editor.',
      },
    },
  },
};
