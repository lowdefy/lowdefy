# Steps

Navigation steps bar, guiding users through the steps of a task.

```yaml
- id: basic_steps
  type: Steps
  properties:
    current: 1
    items:
      - title: Finished
        description: This is a description.
      - title: In Progress
        description: This is a description.
      - title: Waiting
        description: This is a description.
- id: basic_no_description
  type: Steps
  properties:
    current: 0
    items:
      - title: Step 1
      - title: Step 2
      - title: Step 3
- id: basic_four_steps
  type: Steps
  properties:
    current: 2
    items:
      - title: Login
      - title: Verification
      - title: Pay
      - title: Done
```

```yaml
- id: small_steps
  type: Steps
  properties:
    size: small
    current: 1
    items:
      - title: Finished
      - title: In Progress
      - title: Waiting
- id: small_with_description
  type: Steps
  properties:
    size: small
    current: 0
    items:
      - title: Step 1
        description: Brief info
      - title: Step 2
        description: Brief info
      - title: Step 3
        description: Brief info
```

```yaml
- id: icon_steps
  type: Steps
  properties:
    current: 1
    items:
      - title: Login
        icon: AiOutlineUser
      - title: Verification
        icon: AiOutlineSolution
      - title: Done
        icon: AiOutlineSmile
- id: icon_custom_color
  type: Steps
  properties:
    current: 0
    items:
      - title: Upload
        icon:
          name: AiOutlineCloudUpload
          color: "#1677ff"
      - title: Process
        icon:
          name: AiOutlineLoading
          color: "#faad14"
      - title: Complete
        icon:
          name: AiOutlineCheck
          color: "#52c41a"
```

```yaml
- id: vertical_steps
  type: Steps
  properties:
    orientation: vertical
    current: 1
    items:
      - title: Finished
        description: This is a description.
      - title: In Progress
        description: This is a description.
      - title: Waiting
        description: This is a description.
- id: vertical_small
  type: Steps
  properties:
    orientation: vertical
    size: small
    current: 2
    items:
      - title: Order Placed
        description: Your order has been submitted.
      - title: Payment Confirmed
        description: Payment received successfully.
      - title: Shipping
        description: Your package is on its way.
      - title: Delivered
```

```yaml
- id: error_status
  type: Steps
  properties:
    current: 1
    status: error
    items:
      - title: Finished
        description: This is a description.
      - title: In Progress
        description: This is a description.
      - title: Waiting
        description: This is a description.
- id: mixed_status
  type: Steps
  properties:
    current: 2
    items:
      - title: Passed
        status: finish
      - title: Failed
        status: error
      - title: In Review
      - title: Pending
```

```yaml
- id: navigation_steps
  type: Steps
  properties:
    type: navigation
    current: 1
    items:
      - title: Step 1
        subTitle: (00:00:05)
        description: This is a description.
      - title: Step 2
        subTitle: (00:01:02)
        description: This is a description.
      - title: Step 3
        description: This is a description.
```

```yaml
- id: inline_steps
  type: Steps
  properties:
    type: inline
    current: 1
    items:
      - title: Step 1
      - title: Step 2
      - title: Step 3
```

```yaml
- id: panel_steps
  type: Steps
  properties:
    type: panel
    current:
      _state: panel_current
    items:
      - title: Step 1
        description: This is a description.
      - title: Step 2
        description: This is a description.
      - title: Step 3
        description: This is a description.
  events:
    onChange:
      - id: panel_set_state
        type: SetState
        params:
          panel_current:
            _event: current
- id: panel_steps_icons
  type: Steps
  properties:
    type: panel
    current:
      _state: panel_icons_current
    items:
      - title: Account
        description: Create your account
        icon: AiOutlineUser
      - title: Settings
        description: Configure preferences
        icon: AiOutlineSetting
      - title: Review
        description: Review and submit
        icon: AiOutlineCheck
      - title: Done
        description: All finished
  events:
    onChange:
      - id: panel_icons_set_state
        type: SetState
        params:
          panel_icons_current:
            _event: current
```

```yaml
- id: panel_steps
  type: Steps
  properties:
    type: panel
    current:
      _state: panel_current
    items:
      - title: Step 1
        description: This is a description.
      - title: Step 2
        description: This is a description.
      - title: Step 3
        description: This is a description.
  events:
    onChange:
      - id: panel_set_state
        type: SetState
        params:
          panel_current:
            _event: current
- id: panel_steps_icons
  type: Steps
  properties:
    type: panel
    current:
      _state: panel_icons_current
    items:
      - title: Account
        description: Create your account
        icon: AiOutlineUser
      - title: Settings
        description: Configure preferences
        icon: AiOutlineSetting
      - title: Review
        description: Review and submit
        icon: AiOutlineCheck
      - title: Done
        description: All finished
  events:
    onChange:
      - id: panel_icons_set_state
        type: SetState
        params:
          panel_icons_current:
            _event: current
```

```yaml
- id: dot_steps
  type: Steps
  properties:
    type: dot
    current: 1
    items:
      - title: Finished
        description: This is a description.
      - title: In Progress
        description: This is a description.
      - title: Waiting
        description: This is a description.
- id: dot_steps_vertical
  type: Steps
  properties:
    type: dot
    orientation: vertical
    current: 1
    items:
      - title: Finished
        description: This is a description. This is a description.
      - title: In Progress
        description: This is a description. This is a description.
      - title: Waiting
        description: This is a description.
- id: dot_steps_small
  type: Steps
  properties:
    progressDot: true
    size: small
    current: 1
    items:
      - title: Finished
      - title: In Progress
      - title: Waiting
```

```yaml
- id: progress_steps
  type: Steps
  properties:
    current: 1
    percent: 60
    items:
      - title: Finished
      - title: In Progress
      - title: Waiting
- id: progress_steps_25
  type: Steps
  properties:
    current: 0
    percent: 25
    items:
      - title: Upload
      - title: Process
      - title: Done
```

```yaml
- id: label_vertical
  type: Steps
  properties:
    titlePlacement: vertical
    current: 1
    items:
      - title: Step 1
        description: Description
      - title: Step 2
        description: Description
      - title: Step 3
        description: Description
```

```yaml
- id: clickable_steps
  type: Steps
  properties:
    current:
      _state: clickable_current
    items:
      - title: Step 1
        description: Click to go here
      - title: Step 2
        description: Click to go here
      - title: Step 3
        description: Click to go here
  events:
    onChange:
      - id: clickable_set_state
        type: SetState
        params:
          clickable_current:
            _event: current
```

```yaml
- id: clickable_steps
  type: Steps
  properties:
    current:
      _state: clickable_current
    items:
      - title: Step 1
        description: Click to go here
      - title: Step 2
        description: Click to go here
      - title: Step 3
        description: Click to go here
  events:
    onChange:
      - id: clickable_set_state
        type: SetState
        params:
          clickable_current:
            _event: current
```

```yaml
- id: theme_primary
  type: Steps
  properties:
    current: 1
    items:
      - title: Finished
      - title: In Progress
      - title: Waiting
    theme:
      colorPrimary: "#722ed1"
- id: theme_icon_size
  type: Steps
  properties:
    current: 1
    items:
      - title: Step 1
      - title: Step 2
      - title: Step 3
    theme:
      iconSize: 40
      iconFontSize: 18
- id: theme_combined
  type: Steps
  properties:
    current: 1
    items:
      - title: Start
        description: Begin here
      - title: Middle
        description: Keep going
      - title: End
        description: Almost done
    theme:
      colorPrimary: "#52c41a"
      iconSize: 36
      descriptionMaxWidth: 200
      finishIconBorderColor: "#52c41a"
```

```yaml
- id: wizard_card
  type: Card
  properties:
    title: Create Account
    size: small
  blocks:
    - id: wizard_steps
      type: Steps
      properties:
        current:
          _state: wizard_step
        items:
          - title: Account
            icon: AiOutlineUser
          - title: Profile
            icon: AiOutlineIdcard
          - title: Confirm
            icon: AiOutlineCheck
      events:
        onChange:
          - id: wizard_set_step
            type: SetState
            params:
              wizard_step:
                _event: current
    - id: wizard_divider
      type: Divider
    - id: wizard_description
      type: Markdown
      properties:
        content:
          _if:
            test:
              _eq:
                - _state: wizard_step
                - 0
            then: |
              **Step 1: Account Details**

              Enter your email address and create a password to get started.
            else:
              _if:
                test:
                  _eq:
                    - _state: wizard_step
                    - 1
                then: >
                  **Step 2: Profile Information**


                  Tell us a bit about yourself so we can personalize your
                  experience.
                else: |
                  **Step 3: Confirmation**

                  Review your information and confirm to complete registration.
    - id: wizard_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: wizard_prev_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Previous
            color: default
            variant: outlined
            disabled:
              _eq:
                - _state: wizard_step
                - 0
          events:
            onClick:
              - id: wizard_prev_action
                type: SetState
                params:
                  wizard_step:
                    _subtract:
                      - _state:
                          key: wizard_step
                          default: 0
                      - 1
        - id: wizard_next_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title:
              _if:
                test:
                  _eq:
                    - _state: wizard_step
                    - 2
                then: Submit
                else: Next
            color: primary
            variant: solid
          events:
            onClick:
              - id: wizard_next_action
                type: SetState
                skip:
                  _eq:
                    - _state: wizard_step
                    - 2
                params:
                  wizard_step:
                    _sum:
                      - _state:
                          key: wizard_step
                          default: 0
                      - 1
              - id: wizard_done_msg
                type: DisplayMessage
                skip:
                  _not:
                    _eq:
                      - _state: wizard_step
                      - 2
                params:
                  content: Account created successfully!
                  status: success
```

```yaml
- id: wizard_card
  type: Card
  properties:
    title: Create Account
    size: small
  blocks:
    - id: wizard_steps
      type: Steps
      properties:
        current:
          _state: wizard_step
        items:
          - title: Account
            icon: AiOutlineUser
          - title: Profile
            icon: AiOutlineIdcard
          - title: Confirm
            icon: AiOutlineCheck
      events:
        onChange:
          - id: wizard_set_step
            type: SetState
            params:
              wizard_step:
                _event: current
    - id: wizard_divider
      type: Divider
    - id: wizard_description
      type: Markdown
      properties:
        content:
          _if:
            test:
              _eq:
                - _state: wizard_step
                - 0
            then: |
              **Step 1: Account Details**

              Enter your email address and create a password to get started.
            else:
              _if:
                test:
                  _eq:
                    - _state: wizard_step
                    - 1
                then: >
                  **Step 2: Profile Information**


                  Tell us a bit about yourself so we can personalize your
                  experience.
                else: |
                  **Step 3: Confirmation**

                  Review your information and confirm to complete registration.
    - id: wizard_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: wizard_prev_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Previous
            color: default
            variant: outlined
            disabled:
              _eq:
                - _state: wizard_step
                - 0
          events:
            onClick:
              - id: wizard_prev_action
                type: SetState
                params:
                  wizard_step:
                    _subtract:
                      - _state:
                          key: wizard_step
                          default: 0
                      - 1
        - id: wizard_next_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title:
              _if:
                test:
                  _eq:
                    - _state: wizard_step
                    - 2
                then: Submit
                else: Next
            color: primary
            variant: solid
          events:
            onClick:
              - id: wizard_next_action
                type: SetState
                skip:
                  _eq:
                    - _state: wizard_step
                    - 2
                params:
                  wizard_step:
                    _sum:
                      - _state:
                          key: wizard_step
                          default: 0
                      - 1
              - id: wizard_done_msg
                type: DisplayMessage
                skip:
                  _not:
                    _eq:
                      - _state: wizard_step
                      - 2
                params:
                  content: Account created successfully!
                  status: success
```

```yaml
- id: order_card
  type: Card
  properties:
    title: "Order #12345"
    size: small
  blocks:
    - id: order_steps
      type: Steps
      properties:
        orientation: vertical
        current: 2
        items:
          - title: Order Placed
            description: March 10, 2026 at 2:30 PM
            icon: AiOutlineShoppingCart
          - title: Payment Confirmed
            description: March 10, 2026 at 2:31 PM
            icon: AiOutlineCreditCard
          - title: Shipped
            description: March 12, 2026 - Tracking number available
            icon: AiOutlineCar
          - title: Delivered
            description: Estimated March 15, 2026
            icon: AiOutlineHome
```

```yaml
- id: css_tailwind_bg
  type: Steps
  class: bg-bg-layout p-4 rounded-lg
  properties:
    current: 1
    items:
      - title: Draft
      - title: Review
      - title: Published
- id: css_inline_border
  type: Steps
  properties:
    current: 1
    items:
      - title: Upload
      - title: Process
      - title: Complete
  style:
    .element:
      padding: 16px
      border: 1px solid
      borderRadius: 8
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `current` | number | `0` | Index of the current step, counting from 0. |
| `initial` | number | `0` | Starting index of the steps, counting from 0. |
| `status` | string | `"process"` | Status of current step. Enum: `wait`, `process`, `finish`, `error`. |
| `size` | string | `"default"` | Size of the steps. Enum: `default`, `small`. |
| `type` | string | `"default"` | Type of steps. Enum: `default`, `dot`, `inline`, `navigation`, `panel`. |
| `orientation` | string | `"horizontal"` | Orientation of the step bar. Enum: `horizontal`, `vertical`. |
| `titlePlacement` | string | `"horizontal"` | Place title and description horizontal or vertical. Enum: `horizontal`, `vertical`. |
| `percent` | number | - | Progress circle percentage of current step in process status (only works with type default). |
| `progressDot` | boolean | `false` | Steps with progress dot style. |
| `variant` | string | `"filled"` | Style variant of the steps. Enum: `filled`, `outlined`. |
| `responsive` | boolean | `true` | Change to vertical direction when screen width smaller than 532px. |
| `items` | array | - | List of step items. |
| `items.$.title` | string | - | Title of the step - supports html. |
| `items.$.subTitle` | string | - | Subtitle of the step - supports html. |
| `items.$.description` | string | - | Description of the step - supports html. |
| `items.$.icon` | string \| object | - | Name of a React-Icon (See all icons) or properties of an Icon block to use as the step icon. |
| `items.$.status` | string | - | Status of this step, overrides the current step status. Enum: `wait`, `process`, `finish`, `error`. |
| `items.$.disabled` | boolean | `false` | Disable click on this step. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design steps tokens](https://ant.design/components/steps#design-token). |
| `theme.colorPrimary` | string | `"#1677ff"` | Primary color for the active step. |
| `theme.dotCurrentSize` | number | `10` | Size of the current dot in dot style. |
| `theme.dotSize` | number | `8` | Size of dots in dot style. |
| `theme.iconFontSize` | number | `14` | Font size of the step icon. |
| `theme.iconSize` | number | `32` | Size of the step icon. |
| `theme.iconSizeSM` | number | `24` | Size of the small step icon. |
| `theme.iconTop` | number | `-0.5` | Top position of the step icon. |
| `theme.descriptionMaxWidth` | number | `140` | Max width of the step description. |
| `theme.titleLineHeight` | number | `32` | Line height of the step title. |
| `theme.navArrowColor` | string | `"rgba(0, 0, 0, 0.25)"` | Color of the navigation arrow. |
| `theme.navContentMaxWidth` | string | `"auto"` | Max width of navigation step content. |
| `theme.finishIconBorderColor` | string | `"#1677ff"` | Border color of finished step icon. |
| `theme.waitIconBorderColor` | string | `"rgba(0, 0, 0, 0.25)"` | Border color of waiting step icon. |
| `theme.waitIconColor` | string | `"rgba(0, 0, 0, 0.25)"` | Color of waiting step icon. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ current: integer }` | Triggered when a step is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Steps element. |
| `/icon` | The icon in the Steps. |

No slots defined.
