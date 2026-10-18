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

import { disabled, theme } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [
    'ArrowUp',
    'CircleCheck',
    'CornerUpLeft',
    'FileText',
    'Link',
    'Scale',
    'TriangleAlert',
    'X',
  ],
  valueType: 'string',
  cssKeys: {
    element: 'The composer bar.',
    input: 'The rounded field around the text input.',
  },
  events: {
    onBlur: 'Trigger actions when the input loses focus.',
    onCancelReply:
      'Trigger actions when the × on the reply-to banner is pressed. Set `replyTo` to null.',
    onChange: {
      description: 'Trigger actions when the text changes.',
      event: { value: 'The markdown value, with mention tokens.' },
    },
    onFocus: 'Trigger actions when the input gets focus.',
    onLinkSearch: {
      description:
        'Trigger actions 200ms after the text typed after an open `[[` stops changing. Look the query up and set `links` to the hits.',
      event: { query: 'The text typed after `[[`, up to the cursor. Empty right after `[[`.' },
    },
    onSubmit: {
      description:
        'Trigger actions when the send button is pressed. The button shows a spinner while the actions run, and the text clears only when they succeed.',
      event: {
        body: 'The markdown value, with mention tokens and [[KEY]] record links.',
        reply_to: 'The id of `replyTo`, or null for a new thread.',
      },
    },
  },
  methods: {
    focus: 'Focus the input. The SetFocus action with the block id does the same.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Focus the input when the composer mounts.',
      },
      disabled,
      keyboardOffset: {
        type: 'number',
        default: 0,
        description:
          'Distance from the top of the screen to the top of the view the composer sits in, for keyboard avoidance. 0 when the composer is the last thing on the screen.',
      },
      linkIcons: {
        type: 'object',
        description:
          'Icon names for record kinds in the `[[` picker, by kind. Defaults: task `CircleCheck`, document and design `FileText`, decision `Scale`; any other kind `Link`.',
        additionalProperties: { type: 'string' },
      },
      links: {
        type: 'array',
        description:
          'Hits for the `[[` record picker, the answer to onLinkSearch. At most 8 are shown; a pick writes `[[KEY]]`.',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'The record key written into the link.' },
            kind: { type: 'string', description: 'The record kind, which picks the icon.' },
            title: { type: 'string', description: 'The record title.' },
          },
        },
      },
      maxLength: {
        type: 'integer',
        default: 4000,
        description:
          'The longest value that can be sent. A counter shows near the limit and send is disabled past it.',
      },
      mentionFormat: {
        type: 'string',
        default: '[[user:{id}]]',
        description: 'How a mention is written in the value. `{id}` is the person’s id.',
      },
      mentions: {
        type: 'array',
        description:
          'The people who can be mentioned. Typing @ at a word start offers those with `sees` true, ranked by name: names that start with the query, then a word that starts with it, then the rest; at most 8. Mentions in the value of people with `sees` false show muted.',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string', description: 'The person’s id.' },
            label: { type: 'string', description: 'The person’s name.' },
            sees: { type: 'boolean', description: 'Whether the person can see the record.' },
          },
        },
      },
      placeholder: {
        type: 'string',
        default: 'Add a comment…',
        description: 'Text shown in the empty input.',
      },
      replyTo: {
        type: ['object', 'null'],
        description:
          'The comment being replied to. Shows a "Replying to <name>" banner, and onSubmit sends its id as `reply_to`.',
        properties: {
          id: { type: 'string', description: 'The id of the thread’s first comment.' },
          name: { type: 'string', description: 'The name shown in the banner.' },
        },
      },
      sticky: {
        type: 'boolean',
        default: true,
        description:
          'Keep the composer above the keyboard. Place it in the Screen `footer` slot, which pins it to the bottom of the screen outside the scrolling content.',
      },
      theme,
      title: {
        type: 'string',
        description: 'The input’s accessibility label. The placeholder when not set.',
      },
      warning: {
        type: ['string', 'null'],
        description:
          'A warning line above the input, such as a mentioned person who cannot see the record.',
      },
    },
  },
};
