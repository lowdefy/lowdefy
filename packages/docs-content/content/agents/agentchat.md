# AgentChat

The `AgentChat` block renders a streaming AI chat interface. It connects to a [Lowdefy agent](/agents-introduction) and handles message sending, streaming responses, tool approvals, file attachments, and conversation management.

> The `AgentChat` block is provided by the `@lowdefy/blocks-antd-x` package, which is included by default.

###### Minimal example:
```yaml
- id: chat
  type: AgentChat
  properties:
    agentId: assistant
```

###### Full-featured example:
```yaml
- id: chat
  type: AgentChat
  properties:
    agentId: support_agent
    conversationId:
      _state: activeConversationId
    welcome:
      title: How can we help?
      description: Ask about products, orders, or returns.
      prompts:
        - label: Find a product
          description: Search our catalog
        - label: Track my order
          description: Look up order status
    messageDisplay:
      showReasoning: false
      toolResultDisplay: summary
      actions:
        copy: true
        feedback: true
        regenerate: true
      roles:
        assistant:
          name: Support Bot
          avatar: /images/bot.png
    sender:
      placeholder: Describe your issue...
      attachments:
        enabled: true
        accept: image/*,.pdf
  events:
    onMessageComplete:
      - id: save_state
        type: SetState
        params:
          lastResponse:
            _event: content
    onTitleGenerated:
      - id: update_title
        type: SetState
        params:
          conversationTitle:
            _event: title
```

## Properties

### Core

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `agentId` | string | | __Required__ - The `id` of the agent to connect to. |
| `conversationId` | string | | Active conversation ID. When this changes, messages are cleared. If left empty, the block auto-mints a stable id for the session and surfaces it via `onConversationStart`, so every turn posts a consistent id. App-supplied ids are always authoritative. |
| `messages` | array | | Load messages externally. `undefined` = no sync, `null` = clear, array = load. |
| `urlQuery` | object | | Query parameters sent with each request. Available server-side via `_payload`. |
| `sharedState` | object | | Two-way bridge between page state and the agent. See [Shared State](#shared-state). |
| `height` | string | `'calc(100dvh - 170px)'` | CSS height of the chat container. Only applies when `display` is `'inline'`. |
| `maxWidth` | number | `800` | Maximum width in pixels. |
| `display` | string | `'inline'` | `'inline'` renders directly on the page. `'drawer'` renders in a slide-out drawer. |

### Welcome Screen

Shown when the chat has no messages. Clicking a prompt sends the `label` as a message.

- `welcome: object`:
  - `title: string`: Welcome title.
  - `description: string`: Welcome description.
  - `icon`: Icon to display.
  - `variant: string`: `'filled'` or `'borderless'`.
  - `prompts: object[]`: Suggested prompts. Each item:
    - `label: string`: Button label (sent as message when clicked).
    - `description: string`: Button description.
    - `icon`: Button icon.
  - `tracks: object[]`: An alternative to `prompts` for a teaching empty state — two or more labelled columns of starters, e.g. one track to ask a question and another to build a report. A `tracks` welcome renders **in-flow** as the leading item of the transcript (rather than centred and swapped out on the first send), so it scrolls up with the conversation and stays reachable by scrolling back. A track starter **fills the composer** instead of sending, so a suggested prompt becomes an editable first draft rather than a message the user never meant to send. Each track:
    - `label: string`: Track heading.
    - `prompts: (string | object)[]`: Starters — a plain string, or `{ label }`. The text fills the composer on click.

When `tracks` is set, `prompts` is ignored.

###### Two-track welcome (ask a question / build a report):
```yaml
- id: chat
  type: AgentChat
  properties:
    agentId: assistant
    welcome:
      title: Ask about your data
      description: I can see your orders, customers, and activity.
      tracks:
        - label: Get a quick answer
          prompts:
            - Which region has the highest total sales?
            - How many activities were logged last month?
        - label: Build a report
          prompts:
            - Build a report showing trends over time.
            - Build a report comparing categories side by side.
```

### Suggestions

Shown below the last assistant message. Clicking a suggestion sends its `label` as the next message.

- `suggestions: object[]`: Static suggestions. Each item:
  - `key: string`: Unique key.
  - `label: string`: Suggestion text.
  - `description: string`: Optional description.
  - `icon`: Optional icon.

Dynamic suggestions can be sent from the agent's `onFinish` hook as `data-suggestions` data parts. They replace any static suggestions.

### Message Display

- `messageDisplay: object`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `markdownRendering` | boolean | `true` | Render markdown in messages. |
| `renderMermaid` | boolean | `true` | Render Mermaid diagrams in code blocks. |
| `codeHighlighter` | boolean | `true` | Syntax-highlight code blocks. |
| `renderLatex` | boolean | `false` | Render LaTeX math expressions. |
| `showThoughtChain` | boolean | `true` | Show the tool call chain. |
| `showReasoning` | boolean | `true` | Show reasoning/thinking content. |
| `reasoningDisplay` | string | `'interleaved'` | `'interleaved'` shows reasoning inline, `'grouped'` groups it. |
| `showSources` | boolean | `false` | Show source citations from tool results. |
| `showStatusUpdates` | boolean | `true` | Show status update messages. |
| `showStepSeparators` | boolean | `false` | Show separators between agent steps. |
| `showToolInputStreaming` | boolean | `true` | Show tool input as it streams. |
| `editableMessages` | boolean | `true` | Allow editing sent messages by clicking on them. |
| `thinkingMessages` | string \| string[] | | Optional label shown next to the typing dots on a loading assistant bubble. Pass a string for a single label, or an array to rotate through several. Leave unset to show dots only. |
| `thinkingMessageDelay` | number | `3000` | Milliseconds of continuous loading before the first `thinkingMessages` label appears. Clamped to a 500 ms minimum. Ignored when `thinkingMessages` is unset. |
| `thinkingMessageRotationInterval` | number | `8000` | Milliseconds between label rotations when `thinkingMessages` is an array with 2 or more entries. Minimum 500 ms. Ignored for a single string. |

#### Tool Result Display

- `messageDisplay.toolResultDisplay: string | object`: Default: `'summary'` - How to show tool results.
  - `'summary'` — Collapsed summary.
  - `'full'` — Full JSON output.
  - `'readable'` — Formatted, readable view.
  - `'none'` — Hidden.
  - As an object for per-tool settings:

```yaml
messageDisplay:
  toolResultDisplay:
    default: summary
    search-products: full
    get-analytics: readable
```

#### Source Display

- `messageDisplay.sourcesDisplay: object`:
  - `inline: boolean`: Default: `false` - Show sources inline instead of in a collapsible section.
  - `expandIconPosition: string`: Default: `'end'` - Position of the expand icon. `'start'` or `'end'`.

#### Message Actions

- `messageDisplay.actions: string[] | object`: Action buttons on messages.
  - Array form: `['copy', 'feedback', 'regenerate', 'delete', 'audio']`
  - Object form with defaults:

| Action | Default | Description |
| --- | --- | --- |
| `copy` | `true` | Copy message text. |
| `feedback` | `true` | Thumbs up/down rating. |
| `regenerate` | `false` | Regenerate the response. |
| `delete` | `false` | Delete the message. |
| `audio` | `false` | Text-to-speech playback. |

#### Roles

Customize message appearance by role:

- `messageDisplay.roles: object`:
  - `assistant: object`:
    - `name: string`: Display name.
    - `avatar: string`: Avatar image URL.
    - `variant: string`: `'filled'`, `'outlined'`, `'shadow'`, or `'borderless'`.
    - `shape: string`: `'default'`, `'round'`, or `'corner'`.
  - `user: object`: Same properties as `assistant`.

```yaml
messageDisplay:
  roles:
    assistant:
      name: Acme AI
      avatar: /images/acme-bot.png
      variant: filled
      shape: round
    user:
      name: You
      variant: outlined
```

### Sender

- `sender: object`:
  - `placeholder: string`: Default: `'Type a message...'` — Input placeholder. When `config.i18n` is configured, falls back to the localized `agent.sender.placeholder` builtin key. See the [i18n concept page](/i18n) for the full list of localizable agent UI keys (tool approval buttons, message actions, tool-result captions, etc.).
  - `submitType: string`: Default: `'enter'` - Submit key. `'enter'` or `'shiftEnter'`.
  - `allowSpeech: boolean`: Default: `false` - Enable speech input.

#### File Attachments

- `sender.attachments: object`:
  - `enabled: boolean`: Enable file attachments.
  - `accept: string`: Accepted MIME types (e.g. `'image/*,.pdf'`).
  - `maxSize: number`: Maximum file size in bytes.
  - `uploadPolicyRequestId: string`: Id of an upload-policy request (e.g. `AwsS3PresignedPostPolicy`, `GcsSignedPostPolicy`, `AzureBlobUploadSas`). When set, files are uploaded to storage and their URLs are sent to the model instead of base64 data.
  - `downloadPolicyRequestId: string`: Id of a download request used to resolve the URL of an uploaded attachment. The URL is fetched by the model provider, so it must remain reachable — set `public: true` on the request for public buckets, or use a long expiry. When unset, a legacy unsigned object URL is constructed from the upload response (S3-shaped, deprecated).
  - `s3PostPolicyRequestId: string`: __Deprecated__ — use `uploadPolicyRequestId` instead.

###### Attachments uploaded to storage:
```yaml
sender:
  attachments:
    enabled: true
    accept: image/*,.pdf,.docx
    maxSize: 10485760
    uploadPolicyRequestId: get_upload_policy
    downloadPolicyRequestId: get_download_url
```

#### Sender Switches

Toggle switches in the sender footer. The switch state is included in the `onBeforeSend` event and in message metadata.

- `sender.switches: object[]`: Each item:
  - `key: string`: __Required__ - Unique key.
  - `label: string`: __Required__ - Switch label.
  - `icon`: Optional icon.
  - `default: boolean`: Default: `false` - Initial state.

```yaml
sender:
  switches:
    - key: deep_research
      label: Deep Research
      icon: AiOutlineSearch
      default: false
    - key: use_knowledge_base
      label: Use Knowledge Base
      default: true
```

### Drawer Mode

Display the chat in a slide-out drawer with a floating button trigger:

- `drawer: object`: (only when `display: 'drawer'`)
  - `placement: string`: Default: `'right'` - `'left'`, `'right'`, `'top'`, or `'bottom'`.
  - `width: number`: Drawer width in pixels.
  - `title: string`: Drawer title text.

```yaml
properties:
  agentId: assistant
  display: drawer
  drawer:
    placement: right
    width: 500
    title: AI Assistant
```

### Shared State

`sharedState` is a two-way bridge between the page's state and the agent. It is an operator expression that is evaluated at send time, so the latest values are always forwarded.

When the evaluated value is a non-empty object, the block:

1. Sends the object with each request. It is available server-side via `_payload` and is included in the agent's context block when the agent has [`pageContext: true`](/agent-properties).
2. Auto-registers the platform `update-page-state` tool for that turn. The tool's description lists the top-level keys currently in `sharedState`, so the model knows exactly what it can write.

When the agent calls `update-page-state`, the block routes the write through a synthetic `SetState` event. Only keys currently exposed in `sharedState` are applied — any other keys in the agent's call are dropped and returned to the agent as `ignored: [...]` in the tool result so it can self-correct next turn.

###### Expose the entire page state:
```yaml
- id: chat
  type: AgentChat
  properties:
    agentId: assistant
    sharedState:
      _state: true
```

###### Expose a curated shape:
```yaml
- id: chat
  type: AgentChat
  properties:
    agentId: form_filler
    sharedState:
      legal_name:
        _state: legal_name
      registration_number:
        _state: registration_number
```

With the curated form above, the agent can read `legal_name` and `registration_number`, and calling `update-page-state` with either key writes straight back into the page state — no custom endpoint or `onToolResult` handler required.

## Events

| Event | When | Event data |
| --- | --- | --- |
| `onBeforeSend` | Before a message is sent. Return `success: false` to cancel. | `text`, `files`, `messages`, `switches` |
| `onConversationStart` | Once per conversation, on its first user message. | `conversationId` |
| `onUserMessage` | User sends a message. | `role`, `content`, `messageId`, `parts`, `messages` |
| `onMessageComplete` | Agent finishes responding. | `role`, `content`, `messageId`, `parts`, `finishReason`, `isAbort`, `isDisconnect`, `messages` |
| `onToolCall` | Agent calls a tool. | `toolName`, `toolCallId`, `input` |
| `onToolResult` | A tool returns a result. | `toolName`, `toolCallId`, `output`, `error` |
| `onError` | A streaming error occurs. | `message` |
| `onStop` | User stops generation. | `messages` |
| `onFeedback` | User clicks thumbs up/down. | `messageId`, `messageContent`, `rating` |
| `onRegenerate` | User clicks regenerate. | `messageId`, `messages` |
| `onDeleteMessage` | User deletes a message. | `messageId`, `content`, `messages` |
| `onEditMessage` | User edits and resubmits. | `messageId`, `originalContent`, `newContent`, `messages` |
| `onSuggestionClick` | User clicks a suggestion. | `suggestion` |
| `onSwitchChange` | User toggles a sender switch. | `key`, `checked` |
| `onTitleGenerated` | A `data-chat-title` data part arrives — emitted automatically when the agent's [`generateTitle`](/agent-properties) property is set, or manually from an `onFinish` hook. | `title` |
| `onDataPart` | Any data part arrives from the server. | `type`, `data`, `id` |

###### Validate messages before sending:
```yaml
events:
  onBeforeSend:
    - id: check_empty
      type: Throw
      skip:
        _gt:
          - _string.length:
              _event: text
          - 0
      params:
        message: Please enter a message.
```

###### Save feedback to the database:
```yaml
events:
  onFeedback:
    - id: save
      type: Request
      params:
        - save_feedback
    - id: notify
      type: DisplayMessage
      params:
        content: Thanks for your feedback!
        type: success
```

###### Adapt behavior based on sender switches:
```yaml
events:
  onSwitchChange:
    - id: update_state
      type: SetState
      params:
        switches:
          _event:
```

## Methods

Control the chat programmatically using [`CallMethod`](/CallMethod):

| Method | Arguments | Description |
| --- | --- | --- |
| `sendMessage` | `{ text, files?, metadata? }` | Send a message programmatically. |
| `setInput` | `{ text }` | Set the composer's text without sending — seed or clear the input box. Omit `text` to clear. |
| `regenerate` | `{ messageId? }` | Regenerate the last (or a specific) assistant message. |
| `setMessages` | `{ messages }` | Replace all messages with a new array. |
| `clearMessages` | | Clear all messages. |
| `deleteMessage` | `{ messageId }` | Delete a specific message by ID. |
| `stop` | | Stop the current streaming response. |
| `clearError` | | Clear the current error state. |
| `scrollToBottom` | | Scroll the chat to the bottom. |

###### Send a message from a button:
```yaml
- id: quick_action
  type: Button
  properties:
    title: Summarize this page
  events:
    onClick:
      - id: send
        type: CallMethod
        params:
          blockId: chat
          method: sendMessage
          args:
            - text: Please summarize the current page content.
```

###### Prefill the composer without sending:
```yaml
- id: draft_reply
  type: Button
  properties:
    title: Draft a reply
  events:
    onClick:
      - id: prefill
        type: CallMethod
        params:
          blockId: chat
          method: setInput
          args:
            - text: Please draft a polite reply to the last message.
```

###### New conversation button:
```yaml
- id: new_chat
  type: Button
  properties:
    title: New Chat
    icon: AiOutlinePlus
  events:
    onClick:
      - id: new_id
        type: SetState
        params:
          activeConversationId:
            _uuid: v4
```

## Conversation Management

The `AgentChat` block manages the current session in memory. To persist conversations, combine `conversationId` with events and the [`AgentConversations`](/AgentConversations) block.

###### Complete chat page with conversation history:
```yaml
- id: page
  type: PageHeaderMenu
  requests:
    - id: list_conversations
      type: MongoDBFind
      connectionId: app_db
      properties:
        collection: conversations
        query:
          userId:
            _user: id
        options:
          sort:
            updatedAt: -1
    - id: load_messages
      type: MongoDBFindOne
      connectionId: app_db
      properties:
        collection: conversations
        query:
          _id:
            _state: activeConversationId
  events:
    onMount:
      - id: load_list
        type: Request
        params:
          - list_conversations
  blocks:
    - id: layout
      type: Flex
      blocks:
        - id: sidebar
          type: Box
          style:
            width: 280px
          blocks:
            - id: conversations
              type: AgentConversations
              properties:
                items:
                  _array.map:
                    on:
                      _request: list_conversations
                    callback:
                      _function:
                        __args: 0
                        key:
                          __args: 0._id
                        label:
                          __args: 0.title
                        group:
                          __args: 0.group
                activeKey:
                  _state: activeConversationId
                creation:
                  label: New Chat
                menu:
                  - key: delete
                    label: Delete
                    danger: true
              events:
                onSelect:
                  - id: switch
                    type: SetState
                    params:
                      activeConversationId:
                        _event: key
                  - id: load
                    type: Request
                    params:
                      - load_messages
                onNew:
                  - id: new_id
                    type: SetState
                    params:
                      activeConversationId:
                        _uuid: v4
        - id: main
          type: Box
          style:
            flex: 1
          blocks:
            - id: chat
              type: AgentChat
              properties:
                agentId: support_agent
                conversationId:
                  _state: activeConversationId
                messages:
                  _if:
                    test:
                      _ne:
                        - _request: load_messages
                        - null
                    then:
                      _request: load_messages.messages
                    else: null
              events:
                onTitleGenerated:
                  - id: update_title
                    type: SetState
                    params:
                      conversationTitle:
                        _event: title
```

The agent's `onFinish` hook handles server-side persistence. See [Server Hooks](/agent-server-hooks) for details.
