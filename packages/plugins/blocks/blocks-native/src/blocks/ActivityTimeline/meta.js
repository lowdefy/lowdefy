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

import { theme } from '../../schemas/inputProperties.js';

const actor = {
  type: 'object',
  description: 'Who did it. `agent: true` reads "via agent".',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    agent: { type: 'boolean' },
    picture: { type: 'string', description: 'An avatar image url.' },
  },
};

const rule = {
  type: 'object',
  additionalProperties: false,
  properties: {
    when: {
      type: 'object',
      description:
        'Paths into the event and the value each must hold, as `{ "what.to": "done" }`. null matches a missing value; a list matches any of its values. A rule without `when` always matches.',
    },
    icon: { type: 'string', description: 'The rail icon name.' },
    tone: {
      type: 'string',
      description:
        'The icon colour: neutral, primary, info, success, warning, danger, a theme token name or a colour.',
    },
    text: {
      type: 'string',
      description:
        'The line. `{actor}` is who did it; `{path}` is the value at a path in the event (`{what.to}`, `{subject.key}`), with filters `|humanize` ("In progress"), `|words` ("in progress") and `|lower`. Text between `**` pairs is bold. A long line shows two lines ending in an ellipsis until tapped.',
    },
    summary: {
      type: 'string',
      description:
        'What the event says in a folded line of one actor’s detail events, as "recorded {n} decision{s}". Events whose summaries read the same are counted together: `{n}` is the count and `{s}` an "s" when it is not 1. Default "made {n} change{s}".',
    },
    note: {
      type: 'string',
      description:
        'A template for a note drawn under the line, such as `{what.reason}`. A long note shows three lines ending in an ellipsis until its line is tapped.',
    },
  },
};

export default {
  category: 'display',
  icons: [
    'ChevronDown',
    'ChevronRight',
    'CircleCheck',
    'Dot',
    'Ellipsis',
    'FaceSlightlySmilingPlus',
  ],
  valueType: null,
  cssKeys: {
    element: 'The timeline.',
  },
  events: {
    onCopy: {
      description: 'Trigger actions when Copy is picked in a comment’s menu. Use CopyToClipboard.',
      event: {
        comment_id: 'The comment’s id.',
        body: 'The comment’s markdown.',
        text: 'The comment as plain text, with mentions as @Name.',
      },
    },
    onDelete: {
      description: 'Trigger actions when Delete is confirmed in a comment’s menu.',
      event: {
        comment_id: 'The comment’s id.',
        thread_id: 'The id of its thread’s first comment.',
      },
    },
    onEdit: {
      description:
        'Trigger actions when an edited comment is saved. The edit box closes when the actions succeed.',
      event: { comment_id: 'The comment’s id.', body: 'The new markdown, with mention tokens.' },
    },
    onExpandGap: {
      description:
        'Trigger actions when a gap line ("14 earlier changes by …") is pressed. It reads "Loading…" while the actions run. Put the events the gap holds into `entries`.',
      event: {
        after: 'The gap’s `after`.',
        before: 'The gap’s `before`.',
        count: 'The gap’s count.',
        id: 'The gap’s id.',
      },
    },
    onLinkPress: {
      description:
        'Trigger actions when a link in a comment is pressed, instead of opening it in the system browser.',
      event: { href: 'The link’s href.' },
    },
    onLoadReplies: {
      description:
        'Trigger actions when "Show N earlier replies" is pressed on a thread that has replies not in its `replies`. Add them to the thread’s `replies`.',
      event: { thread_id: 'The id of the thread’s first comment.' },
    },
    onOpenRecord: {
      description: 'Trigger actions when a `[[KEY]]` record link in a comment is pressed.',
      event: { key: 'The record key.' },
    },
    onReact: {
      description:
        'Trigger actions when the viewer toggles a reaction. The pill changes at once and holds until the comment’s reactions change in `entries`; it goes back if the actions fail.',
      event: {
        comment_id: 'The comment’s id.',
        emoji: 'The reaction.',
        reacted: 'True when the viewer added the reaction, false when they took it away.',
      },
    },
    onReply: {
      description:
        'Trigger actions when Reply is picked in a comment’s menu. Set the Composer’s `replyTo` to `{ id: thread_id, name }` and focus it.',
      event: {
        comment_id: 'The comment’s id.',
        thread_id: 'The id of its thread’s first comment, which a reply is sent to.',
        name: 'The comment author’s name.',
      },
    },
    onResolve: {
      description:
        'Trigger actions when Resolve or Reopen is picked in a thread’s first comment’s menu.',
      event: {
        comment_id: 'The first comment’s id.',
        resolved: 'True for Resolve, false for Reopen.',
      },
    },
    onShowEarlier: {
      description:
        'Trigger actions when "Show earlier activity" is pressed, shown while `earlier` is true. Add the earlier entries to the start of `entries`.',
      event: { before: 'The time of the oldest entry shown.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      earlier: {
        type: 'boolean',
        default: false,
        description: 'Show "Show earlier activity" at the top, for entries before those given.',
      },
      emptyText: {
        type: 'string',
        description: 'Text shown when there are no entries. Nothing shows when not set.',
      },
      entries: {
        type: 'array',
        description:
          'The activity, oldest first, drawn in the order given. An event is `{ id, at, tier, type, subject, by, what }`, or carries its own `text`, `icon`, `tone`, `summary` and `note`. A comment is `{ id, type: comment, at, by, body, edited_at, deleted, resolved: { by, at }, reactions: [{ emoji, user_ids }], replies, reply_count, mentions: [{ user_id, name, sees }] }`. A gap is `{ type: gap, id, count, actors, types, after, before }`.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            at: { type: ['string', 'object'], description: 'When it happened.' },
            type: {
              type: 'string',
              description: 'The event type, or `comment` or `gap`.',
            },
            tier: {
              type: 'string',
              enum: ['key', 'detail'],
              description:
                'Detail events by one actor in a row fold into one line; key events always show on their own.',
            },
            by: actor,
          },
        },
      },
      foldDetail: {
        type: 'boolean',
        default: true,
        description: 'Fold detail events by one actor in a row into one line.',
      },
      formatEvent: {
        type: 'object',
        description:
          'How each event type is drawn: a rule, or a list of rules of which the first whose `when` matches is used, by event type. `default` holds the rule under every type’s (the default: icon `Dot`, tone neutral, text "{actor} {type|words}").',
        additionalProperties: {
          anyOf: [rule, { type: 'array', items: rule }],
        },
      },
      gaps: {
        type: 'array',
        description:
          'Gaps placed among the entries by time: after the entries up to `after` (a time, or a cursor `<time>~<id>`), or before the entries from `before`. Each is `{ after, before, count, actors, types }`.',
        items: {
          type: 'object',
          properties: {
            after: { type: ['string', 'null'] },
            before: { type: ['string', 'null'] },
            count: { type: 'integer' },
            actors: { type: 'array', items: actor },
            text: { type: 'string', description: 'The line, instead of the counted one.' },
          },
        },
      },
      maxLength: {
        type: 'integer',
        default: 4000,
        description: 'The longest comment the edit box saves.',
      },
      members: {
        type: 'array',
        description:
          'People by id, `[{ value, label, picture }]`, to name an actor given only by id and for avatar pictures.',
      },
      mentionFormat: {
        type: 'string',
        default: '[[user:{id}]]',
        description: 'How a mention is written in a comment body. `{id}` is the person’s id.',
      },
      mentions: {
        type: 'array',
        description:
          'The people who can be mentioned in the edit box, `[{ value, label, sees }]`, as the Composer takes them. Also names mentions a comment’s own `mentions` does not.',
      },
      reactions: {
        type: 'array',
        items: { type: 'string' },
        default: ['👍', '👎', '❤️', '🎉', '😄', '👀', '🙏', '✅'],
        description: 'The reactions the picker offers.',
      },
      repliesShown: {
        type: 'integer',
        default: 3,
        description: 'How many of a thread’s newest replies show before "Show N earlier replies".',
      },
      theme,
      user: {
        type: 'object',
        description:
          'The viewer, `{ id, admin }`. Edit shows on their own comments, Delete on their own and, for an admin, on any. Reactions need an id.',
        properties: {
          id: { type: 'string' },
          admin: { type: 'boolean' },
        },
      },
    },
  },
};
