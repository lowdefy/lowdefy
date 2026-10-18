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

import linkChips from '../../schemas/linkChips.js';

const toolResultMode = { type: 'string', enum: ['summary', 'full', 'none', 'readable'] };

const prompt = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    label: { type: 'string', description: 'The text sent when the chip is pressed.' },
    description: { type: 'string', description: 'A second line on the chip.' },
    icon: { nativeIgnored: true, description: 'Ignored on mobile.' },
  },
};

const endpointId = { type: 'string' };

const welcomeProperties = {
  title: { type: 'string' },
  description: { type: 'string' },
  icon: {
    type: 'string',
    description:
      'Mobile: a Lucide icon name for the glyph where there are no SF Symbols. Defaults to Sparkles.',
  },
  symbol: {
    type: 'string',
    description: 'Mobile only: the SF Symbol drawn on iOS. Defaults to sparkles.',
  },
  prompts: {
    type: 'array',
    description:
      'Starter prompts, shown as chips above the composer. Pressing one sends its label.',
    items: prompt,
  },
};

const welcome = {
  type: 'object',
  description:
    'The empty conversation: a glyph, a title and a description, and prompt chips above the composer.',
  properties: {
    ...welcomeProperties,
    variant: { nativeIgnored: true, type: 'string', description: 'Ignored on mobile.' },
    tracks: { nativeIgnored: true, type: 'array', description: 'Ignored on mobile.' },
  },
};

export default {
  category: 'display',
  // The internal events the block registers: update-page-state's SetState, Copy, a link press,
  // and the thread endpoints' CallAPI.
  actions: ['CallAPI', 'CopyToClipboard', 'Link', 'SetState'],
  operators: ['_event'],
  icons: [
    'ArrowDown',
    'ArrowUp',
    'Check',
    'ChevronDown',
    'ChevronRight',
    'ChevronUp',
    'CircleAlert',
    'CircleCheck',
    'CircleX',
    'FileText',
    'MessagesSquare',
    'Paperclip',
    'RotateCcw',
    'Search',
    'Send',
    'SlidersHorizontal',
    'Sparkles',
    'SquarePen',
    'Trash2',
    'TriangleAlert',
    'Wrench',
  ],
  valueType: null,
  cssKeys: {
    element: 'The conversation, drawn as the page content.',
    composer: 'The composer bar.',
  },
  events: {
    onBeforeSend:
      'Trigger before a typed message is sent. Return success: false (throw) to keep it unsent. Event contains text and messages.',
    onConversationStart:
      'Trigger once when a conversation starts, on its first user message. Event contains the conversationId.',
    onDataPart:
      'Trigger when the agent sends a custom data part. Event contains type, data and id.',
    onError: 'Trigger on a stream error. Event contains message.',
    onLinkClick:
      'Trigger when a link in a message is pressed. Event contains href and text (empty on mobile). Wiring it replaces the default, which opens an app path (`/PEL/tasks/PEL-1`) as a page and any other link outside the app.',
    onMessageComplete:
      'Trigger when a reply finishes streaming. Event contains role, content, messageId, parts, finishReason, isAbort, isDisconnect and messages.',
    onRegenerate:
      'Trigger when the person regenerates a reply. Event contains messageId and messages.',
    onStop: 'Trigger when the person stops a reply. Event contains messages.',
    onSuggestionClick:
      'Trigger when a follow-up suggestion chip is pressed. Event contains suggestion.',
    onThreadChange:
      'Mobile only. Trigger when the open conversation changes: a thread opened from the list, a new chat, or the open thread deleted. Event contains conversationId and title. Not fired for the thread resumed on mount.',
    onTitleGenerated: 'Trigger when the agent sends a conversation title. Event contains title.',
    onToolCall: 'Trigger when a tool is called. Event contains toolName, toolCallId and input.',
    onToolResult:
      'Trigger when a tool finishes. Event contains toolName, toolCallId, output and error.',
    onUserMessage:
      'Trigger when the person sends a message. Event contains role, messageId, content, parts and messages.',
    onDeleteMessage: 'Never fires on mobile: messages are not deleted from the phone.',
    onEditMessage: 'Never fires on mobile: sent messages are not edited.',
    onFeedback: 'Never fires on mobile: there are no rating thumbs.',
    onSwitchChange: 'Never fires on mobile: the composer has no switches.',
  },
  methods: {
    clearError: 'Clear the current error.',
    clearMessages: 'Clear all messages from the chat.',
    deleteMessage: 'Delete a message. Accepts args.messageId.',
    newChat:
      'Mobile only. Start a new conversation, as the composer’s new-chat button does. With `threads` the block mints and keeps it; otherwise onThreadChange gives its conversationId. Accepts args `{ sharedState, welcome, input, tag, title }`, as the `seed` property, to start a chat about a record.',
    openThreads:
      'Mobile only. Open the sheet of recent conversations. Needs `threads` with a list endpoint. Wire it to a Screen header action.',
    regenerate: 'Regenerate the last reply, or args.messageId.',
    scrollToBottom: 'Scroll to the newest message and follow the conversation again.',
    sendMessage: 'Send a message. Accepts args.text.',
    setInput: 'Fill the composer without sending. Accepts args.text; anything else empties it.',
    setMessages: 'Replace the messages. Accepts args.messages.',
    stop: 'Stop the reply that is streaming.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    required: ['agentId'],
    properties: {
      agentId: {
        type: 'string',
        description: 'Id of the agent to chat with.',
      },
      conversationId: {
        type: 'string',
        description:
          'The conversation, when the app keeps its threads. Changing it starts a new chat; load its transcript through `messages`. Not read with `threads`, where the block keeps the conversation.',
      },
      messages: {
        type: ['array', 'null'],
        description:
          'The transcript to show, when the app keeps its threads: an array loads it, null clears the chat. Not read with `threads`.',
      },
      linkChips,
      loading: {
        type: 'boolean',
        description:
          'The app is still loading this conversation: shimmering rows stand in for the messages and nothing can be sent.',
      },
      urlQuery: {
        type: 'object',
        description: 'URL query parameters sent with each agent request.',
      },
      sharedState: {
        type: 'object',
        description:
          'When set to a non-empty object, it is sent to the agent each turn as read context, and the agent can write any of its top-level keys into the page state through the update-page-state tool, as on the web.',
      },
      sharedStateReadOnly: {
        type: 'boolean',
        default: false,
        description:
          'Send `sharedState` as read-only context: the agent is not offered update-page-state.',
      },
      welcome,
      seed: {
        type: 'object',
        additionalProperties: false,
        description:
          'Mobile only. What the chat starts with when it mounts with no thread resumed (no `threads`, `threads.resume` false, or no thread to resume), so a page can open a chat about a record. The newChat method takes the same object as its args. The composer’s new-chat button starts an unseeded chat.',
        properties: {
          sharedState: {
            type: 'object',
            description:
              'Merged under `sharedState` for this conversation: sent to the agent each turn, and writable through update-page-state as the page’s shared keys are. The page’s `sharedState` wins where both set a key.',
          },
          welcome: {
            type: 'object',
            description: 'Laid over the `welcome` property while this conversation is empty.',
            properties: welcomeProperties,
          },
          input: {
            type: 'string',
            description: 'Text put in the composer, unsent, for the person to edit or send.',
          },
          tag: {
            type: 'string',
            description:
              'With `threads`, the tag saved onto this thread in place of `threads.tag`.',
          },
          title: {
            type: 'string',
            description:
              'With `threads`, the thread’s name, kept rather than named from its first exchange. onThreadChange gives it as title.',
          },
        },
      },
      suggestions: {
        type: 'array',
        description:
          'Follow-up chips shown above the composer after a reply. A `data-suggestions` part the agent sends replaces them.',
        items: prompt,
      },
      messageDisplay: {
        type: 'object',
        properties: {
          actions: {
            description:
              'The actions a long press on a reply offers. Mobile supports `copy` and `regenerate` (both by default); `feedback` and `delete` are ignored.',
            oneOf: [
              { type: 'array', items: { type: 'string' } },
              { type: 'object', additionalProperties: { type: 'boolean' } },
            ],
          },
          reasoningDisplay: {
            type: 'string',
            enum: ['interleaved', 'grouped'],
            default: 'interleaved',
            description: 'Draw a reply’s parts in the order they came, or grouped by kind.',
          },
          showReasoning: {
            type: 'boolean',
            default: true,
            description: 'Show the model’s reasoning behind a disclosure.',
          },
          showStatusUpdates: { type: 'boolean', default: true },
          showThoughtChain: {
            type: 'boolean',
            default: true,
            description: 'Show tool calls as compact rows in the reply.',
          },
          showToolInputStreaming: {
            type: 'boolean',
            default: true,
            description: 'Show what a running tool was called with as its summary.',
          },
          thinkingMessages: {
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
            description:
              'The label shown beside the thinking dots after a delay; an array rotates.',
          },
          thinkingMessageDelay: { type: 'number', default: 3000 },
          thinkingMessageRotationInterval: { type: 'number', default: 8000 },
          toolResultDisplay: {
            description:
              'What an opened tool row shows: `summary` and `readable` the output as readable rows, `full` as JSON, `none` nothing. An object sets it per tool name, with `default`.',
            oneOf: [
              toolResultMode,
              {
                type: 'object',
                properties: { default: toolResultMode },
                additionalProperties: toolResultMode,
              },
            ],
          },
          codeHighlighter: {
            nativeIgnored: true,
            type: 'boolean',
            description: 'Ignored on mobile.',
          },
          editableMessages: {
            nativeIgnored: true,
            type: 'boolean',
            description: 'Ignored on mobile.',
          },
          markdownRendering: {
            nativeIgnored: true,
            type: 'boolean',
            description: 'Ignored on mobile.',
          },
          renderLatex: { nativeIgnored: true, type: 'boolean', description: 'Ignored on mobile.' },
          renderMermaid: {
            nativeIgnored: true,
            type: 'boolean',
            description: 'Ignored on mobile.',
          },
          roles: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
          showSources: { nativeIgnored: true, type: 'boolean', description: 'Ignored on mobile.' },
          showStepSeparators: {
            nativeIgnored: true,
            type: 'boolean',
            description: 'Ignored on mobile.',
          },
          sourcesDisplay: {
            nativeIgnored: true,
            type: 'object',
            description: 'Ignored on mobile.',
          },
        },
      },
      sender: {
        type: 'object',
        properties: {
          placeholder: { type: 'string', description: 'The empty composer’s placeholder.' },
          sticky: {
            type: 'boolean',
            default: true,
            description:
              'Mobile only. Draw the composer in the Screen’s footer, pinned above the tab bar and the keyboard, with the conversation as the page content. false draws it under the conversation, for a chat inside a Sheet or Card. Do not give the Screen a footer slot of its own.',
          },
          newChat: {
            type: 'boolean',
            default: true,
            description: 'Mobile only. Show the new-chat button beside the composer.',
          },
          attachments: {
            nativeIgnored: true,
            type: 'object',
            description: 'Ignored on mobile: the basic shell profile has no file or image picker.',
          },
          allowSpeech: { nativeIgnored: true, type: 'boolean', description: 'Ignored on mobile.' },
          classNames: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
          header: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
          styles: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
          submitType: { nativeIgnored: true, type: 'string', description: 'Ignored on mobile.' },
          switches: { nativeIgnored: true, type: 'array', description: 'Ignored on mobile.' },
        },
      },
      threads: {
        type: 'object',
        additionalProperties: false,
        description:
          'Mobile only. Keep the conversations through the app’s thread endpoints (the ai-assistant module’s, or the app’s own of the same shape): resume the thread last opened, save each one as it goes, name it from its first exchange, and list recent ones in a sheet (the openThreads method) where a row opens a thread and a swipe deletes it. Without it the app keeps them, through `conversationId` and `messages`.',
        properties: {
          module: {
            type: 'string',
            description:
              'The id of the app’s ai-assistant module entry. Its endpoints (`<module>/list-threads`, `get-thread`, `get-active-thread`, `save-thread`, `delete-thread`, `title-thread`) are used for any not named in `endpoints`.',
          },
          endpoints: {
            type: 'object',
            additionalProperties: false,
            description:
              'Endpoint ids by what they do, each taking the ai-assistant module endpoint’s payload.',
            properties: {
              listThreads: { ...endpointId, description: '{ scope } → [{ key, label, tags }].' },
              getThread: { ...endpointId, description: '{ conversationId } → { messages }.' },
              getActiveThread: {
                ...endpointId,
                description:
                  '{ scope } → { conversationId, title, messages }, conversationId null for none.',
              },
              saveThread: {
                ...endpointId,
                description: '{ conversationId, messages, title?, scope?, tag }.',
              },
              deleteThread: { ...endpointId, description: '{ conversationId }.' },
              titleThread: {
                ...endpointId,
                description: '{ conversationId, prompt, reply, replaces, context } → { title }.',
              },
            },
          },
          scope: {
            type: 'string',
            description: 'Partitions the threads: listed, resumed and saved per scope and person.',
          },
          tag: {
            type: ['string', 'null'],
            description: 'A label saved onto the thread, shown under it in the list.',
          },
          titleContext: {
            type: ['string', 'null'],
            description: 'One line of grounding for the generated title.',
          },
          generateTitles: {
            type: 'boolean',
            default: true,
            description:
              'Name a thread from its first exchange (titleThread). false keeps the first message as its name.',
          },
          resume: {
            type: 'boolean',
            default: true,
            description:
              'Open the thread last opened in the scope when the chat mounts (getActiveThread).',
          },
          title: {
            type: 'string',
            description: 'The threads sheet’s title. Defaults to "Chats".',
          },
        },
      },
      theme: {
        type: 'object',
        description: 'Theme tokens over the app’s for this block.',
      },
      display: {
        nativeIgnored: true,
        type: 'string',
        description: 'Ignored on mobile: the chat is the page.',
      },
      drawer: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
      feedbackValues: { nativeIgnored: true, type: 'object', description: 'Ignored on mobile.' },
      height: { nativeIgnored: true, type: 'string', description: 'Ignored on mobile.' },
      maxWidth: { nativeIgnored: true, type: 'number', description: 'Ignored on mobile.' },
    },
  },
};
