# Avatar

Avatar with shapes, sizes, icons, images, and color options.

A

B

```yaml
- id: shape_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: shape_circle
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: A
        shape: circle
        color: "#1677ff"
    - id: shape_square
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: B
        shape: square
        color: "#1677ff"
    - id: shape_circle_icon
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineUser
        shape: circle
        color: "#52c41a"
    - id: shape_square_src
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=shape1
        shape: square
```

S

M

L

48

64

```yaml
- id: sizes_row
  type: Box
  layout:
    gap: 8
    align: center
  blocks:
    - id: size_small
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: S
        size: small
        color: "#722ed1"
    - id: size_default
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: M
        size: default
        color: "#722ed1"
    - id: size_large
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: L
        size: large
        color: "#722ed1"
    - id: size_numeric_48
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: "48"
        size: 48
        color: "#eb2f96"
    - id: size_numeric_64
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: "64"
        size: 64
        color: "#eb2f96"
```

U

JD

Tom

7

+5

```yaml
- id: text_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: text_single
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: U
        color: "#1677ff"
    - id: text_initials
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: JD
        color: "#52c41a"
    - id: text_name
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: Tom
        color: "#fa8c16"
        size: large
    - id: text_number
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: "7"
        color: "#f5222d"
    - id: text_overflow
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: "+5"
        color: "#d9d9d9"
```

```yaml
- id: icons_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: icon_user
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineUser
        color: "#1677ff"
    - id: icon_team
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineTeam
        color: "#722ed1"
    - id: icon_star
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineStar
        color: "#faad14"
    - id: icon_custom_color
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon:
          name: AiOutlineThunderbolt
          color: "#fff700"
        color: "#000000"
    - id: icon_custom_large
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon:
          name: AiOutlineCrown
          color: "#fff"
        color: "#722ed1"
        size: large
```

```yaml
- id: src_row
  type: Box
  layout:
    gap: 8
    align: center
  blocks:
    - id: src_circle
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=1
        size: large
    - id: src_square
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=4
        size: large
        shape: square
    - id: src_with_alt
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=6
        alt: User profile picture
        size: large
```

A

B

C

D

E

```yaml
- id: colors_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: color_blue
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: A
        color: "#1677ff"
    - id: color_green
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: B
        color: "#52c41a"
    - id: color_red
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: C
        color: "#f5222d"
    - id: color_purple
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: D
        color: "#722ed1"
    - id: color_gold
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: E
        color: "#faad14"
```

Gap2

Gap4

Gap8

```yaml
- id: gap_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: gap_2
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: Gap2
        color: "#722ed1"
        gap: 2
        size: large
    - id: gap_4
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: Gap4
        color: "#1677ff"
        gap: 4
        size: large
    - id: gap_8
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: Gap8
        color: "#13c2c2"
        gap: 8
        size: large
```

JD

```yaml
- id: click_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: click_avatar
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineUser
        color: "#1677ff"
        size: large
      events:
        onClick:
          - id: click_msg
            type: DisplayMessage
            params:
              content: Avatar clicked!
              status: info
    - id: click_text_avatar
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: JD
        color: "#52c41a"
        size: large
      events:
        onClick:
          - id: click_text_msg
            type: DisplayMessage
            params:
              content: Viewing profile for JD
              status: success
    - id: click_image_avatar
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=click
        size: large
      events:
        onClick:
          - id: click_image_msg
            type: DisplayMessage
            params:
              content: Opening user settings
              status: info
```

SH

OP

BD

SH

```yaml
- id: css_tailwind_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: css_shadow
      type: Avatar
      layout:
        flex: 0 0 auto
      class: shadow-lg
      properties:
        content: SH
        color: "#1677ff"
        size: large
    - id: css_ring
      type: Avatar
      layout:
        flex: 0 0 auto
      class: ring-2 ring-blue-500 ring-offset-2
      properties:
        src: https://api.dicebear.com/7.x/miniavs/svg?seed=ring
        size: large
    - id: css_opacity
      type: Avatar
      layout:
        flex: 0 0 auto
      class: opacity-60
      properties:
        content: OP
        color: "#722ed1"
        size: large
- id: css_inline_row
  type: Box
  layout:
    gap: 8
  blocks:
    - id: css_border
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: BD
        color: "#1677ff"
      style:
        .element:
          border: 2px solid
    - id: css_box_shadow
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: SH
        color: "#722ed1"
      style:
        .element:
          boxShadow: 0 2px 8px rgba(114, 46, 209, 0.4)
    - id: css_gradient
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineStar
        size: large
      style:
        .element:
          background: linear-gradient(135deg,
    - id: css_dashed_outline
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlinePlus
        size: large
      style:
        .element:
          color: "#1677ff"
          border: 2px dashed
```

Hi

SM

```yaml
- id: theme_row
  type: Box
  layout:
    gap: 8
    align: center
  blocks:
    - id: theme_large_container
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineUser
        size: large
        color: "#1677ff"
        theme:
          containerSizeLG: 56
          iconFontSizeLG: 32
    - id: theme_text_size
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: Hi
        size: large
        color: "#52c41a"
        theme:
          containerSizeLG: 48
          textFontSizeLG: 20
    - id: theme_small_override
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        content: SM
        size: small
        color: "#fa8c16"
        theme:
          containerSizeSM: 20
          textFontSizeSM: 10
    - id: theme_default_override
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        icon: AiOutlineStar
        color: "#722ed1"
        theme:
          containerSize: 44
          iconFontSize: 24
```

```yaml
- id: group_row
  type: Box
  layout:
    gap: 24
    align: center
  blocks:
    - id: group_basic
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          avatars:
            - src: https://api.dicebear.com/7.x/miniavs/svg?seed=1
            - content: BK
              color: "#1677ff"
            - icon: AiOutlineUser
              color: "#87d068"
            - content: ZW
              color: "#722ed1"
    - id: group_max_count
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          maxCount: 3
          avatars:
            - src: https://api.dicebear.com/7.x/miniavs/svg?seed=2
            - content: AL
              color: "#f56a00"
            - icon: AiOutlineUser
              color: "#1677ff"
            - content: KJ
              color: "#722ed1"
            - content: RW
              color: "#52c41a"
    - id: group_square
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        shape: square
        group:
          avatars:
            - content: A
              color: "#1677ff"
            - content: B
              color: "#52c41a"
            - content: C
              color: "#f5222d"
    - id: group_large
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          size: large
          avatars:
            - src: https://api.dicebear.com/7.x/miniavs/svg?seed=3
            - content: LG
              color: "#eb2f96"
            - icon: AiOutlineStar
              color: "#faad14"
```

```yaml
- id: group_style_row
  type: Box
  layout:
    gap: 24
    align: center
  blocks:
    - id: group_orange_overflow
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          maxCount: 2
          avatars:
            - content: K
              color: "#1677ff"
            - content: L
              color: "#52c41a"
            - content: M
              color: "#722ed1"
            - content: N
              color: "#eb2f96"
      style:
        .max:
          color: "#f56a00"
    - id: group_dark_overflow
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          maxCount: 3
          avatars:
            - src: https://api.dicebear.com/7.x/miniavs/svg?seed=5
            - content: AB
              color: "#52c41a"
            - icon: AiOutlineUser
              color: "#722ed1"
            - content: CD
              color: "#f5222d"
            - content: EF
              color: "#fa8c16"
      style:
        .max:
          color: "#fff"
          backgroundColor: "#1677ff"
    - id: group_red_overflow
      type: Avatar
      layout:
        flex: 0 0 auto
      properties:
        group:
          maxCount: 2
          avatars:
            - content: P
              color: "#1677ff"
            - content: Q
              color: "#52c41a"
            - content: R
              color: "#722ed1"
            - content: S
              color: "#faad14"
            - content: T
              color: "#eb2f96"
      style:
        .max:
          color: "#fff"
          backgroundColor: "#f5222d"
          fontWeight: bold
```

**Sarah Chen**

Senior Engineer at Acme Corp

```yaml
- id: profile_card
  type: Card
  properties:
    title: User Profile
    size: small
  blocks:
    - id: profile_row
      type: Box
      layout:
        gap: 16
        align: center
      blocks:
        - id: profile_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            src: https://api.dicebear.com/7.x/miniavs/svg?seed=sarah
            size: large
            alt: Sarah Chen
          style:
            .element:
              border: 2px solid
          events:
            onClick:
              - id: profile_click_msg
                type: DisplayMessage
                params:
                  content: Edit profile photo
                  status: info
        - id: profile_info
          type: Box
          layout:
            gap: 0
          blocks:
            - id: profile_name
              type: Markdown
              properties:
                content: "**Sarah Chen**"
            - id: profile_role
              type: Markdown
              properties:
                content: Senior Engineer at Acme Corp
    - id: profile_divider
      type: Divider
    - id: profile_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: profile_edit_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Edit Profile
            color: primary
            variant: outlined
            icon: AiOutlineEdit
          events:
            onClick:
              - id: profile_edit_msg
                type: DisplayMessage
                params:
                  content: Opening profile editor
                  status: info
        - id: profile_msg_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Send Message
            color: primary
            variant: solid
            icon: AiOutlineMail
          events:
            onClick:
              - id: profile_msg_msg
                type: DisplayMessage
                params:
                  content: Message sent to Sarah Chen
                  status: success
```

**6 team members**

Dashboard redesign project

```yaml
- id: team_card
  type: Card
  properties:
    title: Project Team
    size: small
  blocks:
    - id: team_row
      type: Box
      layout:
        gap: 16
        align: center
      blocks:
        - id: team_avatars
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            group:
              maxCount: 4
              size: large
              avatars:
                - src: https://api.dicebear.com/7.x/miniavs/svg?seed=sarah
                  alt: Sarah Chen
                - content: MR
                  color: "#1677ff"
                - src: https://api.dicebear.com/7.x/miniavs/svg?seed=elena
                  alt: Elena Torres
                - content: JD
                  color: "#52c41a"
                - icon: AiOutlineUser
                  color: "#722ed1"
                - content: KP
                  color: "#fa8c16"
          style:
            .max:
              color: "#f56a00"
        - id: team_info
          type: Box
          layout:
            gap: 0
          blocks:
            - id: team_title
              type: Markdown
              properties:
                content: "**6 team members**"
            - id: team_subtitle
              type: Markdown
              properties:
                content: Dashboard redesign project
```

The new dashboard layout looks great. Can we add a date filter to the reports section?

MR

Good idea! I will add it to the next sprint. Should be ready by Friday.

I've started on the date picker component. Quick question — should it default to the current month or last 30 days?

```yaml
- id: thread
  type: Box
  layout:
    gap: 0
  blocks:
    - id: c1
      type: Box
      layout:
        gap: 12
        align: flex-start
        wrap: nowrap
      style:
        .element:
          padding: 16px 0
      blocks:
        - id: c1_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            src: https://api.dicebear.com/7.x/miniavs/svg?seed=sarah
          style:
            .element:
              border: 2px solid
          events:
            onClick:
              - id: c1_profile
                type: DisplayMessage
                params:
                  content: View Sarah Chen's profile
                  status: info
        - id: c1_body
          type: Box
          layout:
            flex: 1 1 0
            gap: 4
          blocks:
            - id: c1_header
              type: Html
              properties:
                html: <b>Sarah Chen</b> <span style="color:#8c8c8c;font-size:13px">&middot; 2h
                  ago</span>
            - id: c1_text
              type: Span
              properties:
                content: The new dashboard layout looks great. Can we add a date filter to the
                  reports section?
            - id: c1_actions
              type: Box
              layout:
                gap: 16
              style:
                .element:
                  marginTop: 4
              blocks:
                - id: c1_like
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineLike
                    title: Like
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
                - id: c1_reply
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineMessage
                    title: Reply
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
    - id: c_divider_1
      type: Divider
      style:
        .element:
          margin: 0
    - id: c2
      type: Box
      layout:
        gap: 12
        align: flex-start
        wrap: nowrap
      style:
        .element:
          padding: 16px 0
      blocks:
        - id: c2_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            content: MR
            color: "#1677ff"
          events:
            onClick:
              - id: c2_profile
                type: DisplayMessage
                params:
                  content: View Marcus Reed's profile
                  status: info
        - id: c2_body
          type: Box
          layout:
            flex: 1 1 0
            gap: 4
          blocks:
            - id: c2_header
              type: Html
              properties:
                html: <b>Marcus Reed</b> <span style="color:#8c8c8c;font-size:13px">&middot; 1h
                  ago</span>
            - id: c2_text
              type: Span
              properties:
                content: Good idea! I will add it to the next sprint. Should be ready by Friday.
            - id: c2_actions
              type: Box
              layout:
                gap: 16
              style:
                .element:
                  marginTop: 4
              blocks:
                - id: c2_like
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineLike
                    title: Like
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
                - id: c2_reply
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineMessage
                    title: Reply
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
    - id: c_divider_2
      type: Divider
      style:
        .element:
          margin: 0
    - id: c3
      type: Box
      layout:
        gap: 12
        align: flex-start
        wrap: nowrap
      style:
        .element:
          padding: 16px 0
      blocks:
        - id: c3_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            src: https://api.dicebear.com/7.x/miniavs/svg?seed=elena
          events:
            onClick:
              - id: c3_profile
                type: DisplayMessage
                params:
                  content: View Elena Torres's profile
                  status: info
        - id: c3_body
          type: Box
          layout:
            flex: 1 1 0
            gap: 4
          blocks:
            - id: c3_header
              type: Html
              properties:
                html: <b>Elena Torres</b> <span style="color:#8c8c8c;font-size:13px">&middot;
                  45m ago</span>
            - id: c3_text
              type: Span
              properties:
                content: I've started on the date picker component. Quick question — should it
                  default to the current month or last 30 days?
            - id: c3_actions
              type: Box
              layout:
                gap: 16
              style:
                .element:
                  marginTop: 4
              blocks:
                - id: c3_like
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineLike
                    title: Like
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
                - id: c3_reply
                  type: Anchor
                  layout:
                    flex: 0 0 auto
                  properties:
                    icon: AiOutlineMessage
                    title: Reply
                  style:
                    .element:
                      fontSize: 13px
                      color: "#8c8c8c"
    - id: c_divider_3
      type: Divider
      style:
        .element:
          margin: 0
    - id: reply_row
      type: Box
      layout:
        gap: 12
        align: flex-start
        wrap: nowrap
      style:
        .element:
          paddingTop: 16
      blocks:
        - id: reply_avatar
          type: Avatar
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineUser
            color: "#52c41a"
        - id: reply_body
          type: Box
          layout:
            flex: 1 1 0
            gap: 8
          blocks:
            - id: reply_input
              type: TextInput
              properties:
                label:
                  disabled: true
                placeholder: Write a reply...
            - id: reply_btn
              type: Button
              layout:
                flex: 0 0 auto
              properties:
                title: Reply
                color: primary
                variant: solid
                icon: AiOutlineSend
              events:
                onClick:
                  - id: reply_msg
                    type: DisplayMessage
                    params:
                      content: Reply posted
                      status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `alt` | string | - | This attribute defines the alternative text describing the image. |
| `color` | string | - | The background color of the avatar if not using a src url. Should be a hex color string. Color is a random color if not specified. |
| `content` | string | - | Text to display inside avatar. |
| `gap` | number | - | Letter type unit distance between left and right sides. |
| `icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to use an icon in avatar. |
| `shape` | string | `"circle"` | Shape of the avatar. Enum: `circle`, `square`. |
| `size` | string \| number \| object | `"default"` | Size of the avatar: default, small, large, a pixel number, or a responsive object of breakpoint sizes. |
| `src` | string | - | The address of the image for an image avatar. |
| `group` | object | - | Render as an avatar group with multiple avatars. When set, the block renders Avatar.Group wrapping data-driven avatars. |
| `group.maxCount` | number | - | Max avatars to show. Excess shows as "+N". |
| `group.maxPopoverPlacement` | string | `"top"` | Placement of the overflow popover. Enum: `top`, `bottom`. |
| `group.maxPopoverTrigger` | string | `"hover"` | Trigger mode for the overflow popover. Enum: `hover`, `click`. |
| `group.shape` | string | - | Default shape for all avatars in the group. Enum: `circle`, `square`. |
| `group.size` | string \| number | - | Default size for all avatars in the group: default, small, large or a pixel number. |
| `group.avatars` | array | - | Array of avatar configurations. |
| `group.avatars.$.alt` | string | - | Alt text for image avatar. |
| `group.avatars.$.color` | string | - | Background color. |
| `group.avatars.$.content` | string | - | Text content inside the avatar. |
| `group.avatars.$.gap` | number | - | Letter type unit distance between left and right sides. |
| `group.avatars.$.icon` | string \| object | - | Icon name or properties. |
| `group.avatars.$.shape` | string | - | Override shape for this avatar. Enum: `circle`, `square`. |
| `group.avatars.$.size` | string \| number | - | Override size for this avatar. Enum: `default`, `small`, `large`. |
| `group.avatars.$.src` | string | - | Image URL. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design avatar tokens](https://ant.design/components/avatar#design-token). |
| `theme.containerSize` | number | `32` | Size of the avatar. |
| `theme.containerSizeLG` | number | `40` | Size of the large avatar. |
| `theme.containerSizeSM` | number | `24` | Size of the small avatar. |
| `theme.textFontSize` | number | `14` | Text font size of the avatar. |
| `theme.textFontSizeLG` | number | `14` | Text font size of the large avatar. |
| `theme.textFontSizeSM` | number | `14` | Text font size of the small avatar. |
| `theme.iconFontSize` | number | `18` | Icon size within the avatar. |
| `theme.iconFontSizeLG` | number | `24` | Icon size within the large avatar. |
| `theme.iconFontSizeSM` | number | `14` | Icon size within the small avatar. |
| `theme.groupSpace` | number | `4` | Spacing between grouped avatars. |
| `theme.groupOverlapping` | number | `-8` | Negative margin for avatar overlap in groups. |
| `theme.groupBorderColor` | string | `"#ffffff"` | Border color applied to grouped avatars. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Triggered when avatar item is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Avatar element. |
| `/icon` | The icon in the Avatar. |
| `/max` | The Avatar max overflow style. |

No slots defined.
