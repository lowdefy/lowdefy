---
name: lowdefy-notifications
description: Use when giving the user feedback after an action — `DisplayMessage`, `Notification`, `Message` blocks, action `messages`, and when a `Result` block is the better choice.
---

# User notifications

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Message

`/lowdefy-docs/content/display-blocks/message`

Global message notification displayed at the top of the page.

#### Notification

`/lowdefy-docs/content/display-blocks/notification`

Notification message displayed in the corner of the page.

#### DisplayMessage

`/lowdefy-docs/content/actions/displaymessage`

The `DisplayMessage` action is used to display a message to a user.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### Message

Provided by `@lowdefy/blocks-antd`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `content` | string |  |  | The content of the message - supports html. |
| `duration` | number |  | `4.5` | Time(seconds) before auto-dismiss, don't dismiss if set to 0. |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize message icon. |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"`, `"loading"` |  | `"info"` | Message status type. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClose`: Trigger actions when message is closed.

##### Example

```yaml
- id: status_success_msg
  type: Message
  properties:
    status: success
    content: Operation completed successfully
```

#### Notification

Provided by `@lowdefy/blocks-antd`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `bottom` | number |  | `24` | Distance from the bottom of the viewport, when placement is bottomRight or bottomLeft (unit: pixels). |
| `button` | object |  |  | Button object to customized the close button. Triggers onClose event when clicked. |
| `description` | string |  |  | The content of notification box - supports html. |
| `duration` | number |  | `4.5` | Time in seconds before Notification is closed. When set to 0 or null, it will never be closed automatically. |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize notification icon. |
| `closeIcon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize close icon. |
| `title` | string |  |  | The title of notification box - supports html. |
| `placement` | `"topLeft"`, `"topRight"`, `"bottomLeft"`, `"bottomRight"` |  | `"topRight"` | Position of Notification. |
| `top` | number |  | `24` | Distance from the top of the viewport, when placement is topRight or topLeft (unit: pixels). |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"` |  |  | Notification status type. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

- `onClose`: Trigger actions when notification is closed.
- `onClick`: Trigger actions when notification is clicked.

##### Example

```yaml
- id: notif_status_success
  type: Notification
  layout:
    span: 0
  properties:
    status: success
    title: Changes Saved
    description: Your changes have been saved successfully.
```

#### Result

Provided by `@lowdefy/blocks-antd`. Category: `container`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `icon` | string \\| object |  |  | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon to use as result image. |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"`, `"404"`, `"403"`, `"500"` |  | `"info"` | Status of the result. Determines image and color. |
| `subTitle` | string |  |  | Result subtitle or secondary text - supports html. |
| `title` | string |  |  | Result title or primary text - supports html. |
| `theme` | object |  |  | Antd design token overrides for this block. See antd design tokens. |

##### Events

_No events._

##### Example

```yaml
- id: status_success
  type: Result
  properties:
    status: success
    title: Successfully Purchased Cloud Server
    subTitle: 'Order number: 2026-0342-8756-0028. Cloud server configuration takes 1-5 minutes, please wait.'
```

### Actions

Live schema: `lowdefy_get_schema` with kind `actions`.

#### DisplayMessage

Provided by `@lowdefy/actions-core`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `"success"`, `"error"`, `"info"`, `"warning"`, `"loading"` |  |  | The message status type. |
| `content` | string |  |  | The message content to display. |
| `duration` | number |  |  | Duration in seconds before the message disappears. Set to 0 for persistent. |
<!-- generated:reference:end -->

## Recipe

Must cover: `DisplayMessage` after a successful `Request`, action `messages: { loading, success, error }`, `Notification` via `CallMethod` for persistent alerts, `Result` for terminal states, and never notifying on `onInit`.
