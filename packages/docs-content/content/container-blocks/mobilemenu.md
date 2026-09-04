# MobileMenu

Responsive mobile navigation menu with drawer.

```yaml
- id: basic_simple
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: bs_home
        type: MenuLink
        properties:
          title: Home
      - id: bs_about
        type: MenuLink
        properties:
          title: About
      - id: bs_contact
        type: MenuLink
        properties:
          title: Contact
- id: basic_icons
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: bi_dashboard
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineDashboard
      - id: bi_users
        type: MenuLink
        properties:
          title: Users
          icon: AiOutlineUser
      - id: bi_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: basic_page_links
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: bpl_docs
        type: MenuLink
        pageId: docs
        properties:
          title: Documentation
          icon: AiOutlineFileText
      - id: bpl_api
        type: MenuLink
        pageId: api-reference
        properties:
          title: API Reference
          icon: AiOutlineApi
      - id: bpl_changelog
        type: MenuLink
        pageId: changelog
        properties:
          title: Changelog
          icon: AiOutlineHistory
```

```yaml
- id: groups_single
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: gs_overview
        type: MenuLink
        properties:
          title: Overview
          icon: AiOutlineHome
      - id: gs_management
        type: MenuGroup
        properties:
          title: Management
          icon: AiOutlineAppstore
        links:
          - id: gs_projects
            type: MenuLink
            properties:
              title: Projects
          - id: gs_tasks
            type: MenuLink
            properties:
              title: Tasks
- id: groups_nested
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: gn_content
        type: MenuGroup
        properties:
          title: Content
          icon: AiOutlineFileText
        links:
          - id: gn_posts
            type: MenuLink
            properties:
              title: Posts
          - id: gn_pages
            type: MenuLink
            properties:
              title: Pages
      - id: gn_users
        type: MenuGroup
        properties:
          title: Users
          icon: AiOutlineTeam
        links:
          - id: gn_all
            type: MenuLink
            properties:
              title: All Users
          - id: gn_roles
            type: MenuLink
            properties:
              title: Roles
- id: groups_deep
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: gd_products
        type: MenuGroup
        properties:
          title: Products
          icon: AiOutlineShop
        links:
          - id: gd_electronics
            type: MenuGroup
            properties:
              title: Electronics
            links:
              - id: gd_phones
                type: MenuLink
                properties:
                  title: Phones
              - id: gd_laptops
                type: MenuLink
                properties:
                  title: Laptops
```

```yaml
- id: divider_basic
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: db_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: db_divider
        type: MenuDivider
      - id: db_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: divider_dashed
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: dd_profile
        type: MenuLink
        properties:
          title: Profile
          icon: AiOutlineUser
      - id: dd_divider
        type: MenuDivider
        properties:
          dashed: true
      - id: dd_help
        type: MenuLink
        properties:
          title: Help Center
          icon: AiOutlineQuestionCircle
- id: divider_danger
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: dg_account
        type: MenuLink
        properties:
          title: Account
          icon: AiOutlineUser
      - id: dg_divider
        type: MenuDivider
      - id: dg_delete
        type: MenuLink
        properties:
          title: Delete Account
          icon: AiOutlineDelete
          danger: true
      - id: dg_logout
        type: MenuLink
        properties:
          title: Sign Out
          icon: AiOutlineLogout
          danger: true
```

```yaml
- id: theme_light
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    theme: light
    links:
      - id: tl_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: tl_explore
        type: MenuLink
        properties:
          title: Explore
          icon: AiOutlineCompass
      - id: tl_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: theme_dark
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    theme: dark
    links:
      - id: td_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: td_explore
        type: MenuLink
        properties:
          title: Explore
          icon: AiOutlineCompass
      - id: td_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
```

```yaml
- id: selected_single
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    selectedKeys:
      - sk_users
    links:
      - id: sk_dashboard
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineDashboard
      - id: sk_users
        type: MenuLink
        properties:
          title: Users
          icon: AiOutlineUser
      - id: sk_reports
        type: MenuLink
        properties:
          title: Reports
          icon: AiOutlineBarChart
- id: selected_multiple
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    selectedKeys:
      - sm_inbox
      - sm_sent
    links:
      - id: sm_inbox
        type: MenuLink
        properties:
          title: Inbox
          icon: AiOutlineInbox
      - id: sm_sent
        type: MenuLink
        properties:
          title: Sent
          icon: AiOutlineSend
      - id: sm_drafts
        type: MenuLink
        properties:
          title: Drafts
          icon: AiOutlineEdit
- id: selected_in_group
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    selectedKeys:
      - sig_tasks
    links:
      - id: sig_overview
        type: MenuLink
        properties:
          title: Overview
          icon: AiOutlineHome
      - id: sig_project
        type: MenuGroup
        properties:
          title: Project
          icon: AiOutlineProject
        links:
          - id: sig_tasks
            type: MenuLink
            properties:
              title: Tasks
          - id: sig_timeline
            type: MenuLink
            properties:
              title: Timeline
```

```yaml
- id: toggle_default_type
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    toggleMenuButton:
      type: default
      icon: AiOutlineMenu
    links:
      - id: tdt_home
        type: MenuLink
        properties:
          title: Home
      - id: tdt_about
        type: MenuLink
        properties:
          title: About
- id: toggle_text_variant
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    toggleMenuButton:
      type: text
      icon: AiOutlineUnorderedList
    links:
      - id: ttv_home
        type: MenuLink
        properties:
          title: Home
      - id: ttv_about
        type: MenuLink
        properties:
          title: About
- id: toggle_danger_style
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    toggleMenuButton:
      type: primary
      icon: AiOutlineBars
      danger: true
    links:
      - id: tds_home
        type: MenuLink
        properties:
          title: Home
      - id: tds_about
        type: MenuLink
        properties:
          title: About
```

```yaml
- id: drawer_titled
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    drawer:
      title: Navigation
      width: 280
    links:
      - id: dt_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: dt_profile
        type: MenuLink
        properties:
          title: Profile
          icon: AiOutlineUser
- id: drawer_left
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    drawer:
      title: Menu
      placement: left
      width: 240
    links:
      - id: dl_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: dl_search
        type: MenuLink
        properties:
          title: Search
          icon: AiOutlineSearch
- id: drawer_wide
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    drawer:
      title: Browse
      width: 360
      closable: true
      mask: true
      maskClosable: true
    links:
      - id: dw_categories
        type: MenuGroup
        properties:
          title: Categories
          icon: AiOutlineAppstore
        links:
          - id: dw_electronics
            type: MenuLink
            properties:
              title: Electronics
          - id: dw_clothing
            type: MenuLink
            properties:
              title: Clothing
```

```yaml
- id: delay_fast
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    subMenuOpenDelay: 0
    subMenuCloseDelay: 0
    links:
      - id: df_tools
        type: MenuGroup
        properties:
          title: Tools
          icon: AiOutlineTool
        links:
          - id: df_editor
            type: MenuLink
            properties:
              title: Editor
          - id: df_terminal
            type: MenuLink
            properties:
              title: Terminal
- id: delay_slow
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    subMenuOpenDelay: 0.5
    subMenuCloseDelay: 1
    links:
      - id: ds_tools
        type: MenuGroup
        properties:
          title: Tools
          icon: AiOutlineTool
        links:
          - id: ds_editor
            type: MenuLink
            properties:
              title: Editor
          - id: ds_terminal
            type: MenuLink
            properties:
              title: Terminal
```

```yaml
- id: events_toggle
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: et_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: et_about
        type: MenuLink
        properties:
          title: About
          icon: AiOutlineInfoCircle
  events:
    onToggleDrawer:
      - id: toggle_msg
        type: DisplayMessage
        params:
          content: Drawer toggled
          status: info
- id: events_open_close
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: eoc_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: eoc_profile
        type: MenuLink
        properties:
          title: Profile
          icon: AiOutlineUser
  events:
    onOpen:
      - id: open_msg
        type: DisplayMessage
        params:
          content: Menu opened
          status: success
    onClose:
      - id: close_msg
        type: DisplayMessage
        params:
          content: Menu closed
          status: warning
- id: events_item_click
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: eic_dashboard
        type: MenuLink
        properties:
          title: Dashboard
          icon: AiOutlineDashboard
      - id: eic_reports
        type: MenuLink
        properties:
          title: Reports
          icon: AiOutlineBarChart
  events:
    onMenuItemClick:
      - id: click_msg
        type: DisplayMessage
        params:
          content: Menu item clicked
          status: info
    onMenuItemSelect:
      - id: select_msg
        type: DisplayMessage
        params:
          content: Menu item selected
          status: success
- id: events_group_toggle
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: egt_tools
        type: MenuGroup
        properties:
          title: Tools
          icon: AiOutlineTool
        links:
          - id: egt_editor
            type: MenuLink
            properties:
              title: Editor
          - id: egt_terminal
            type: MenuLink
            properties:
              title: Terminal
  events:
    onToggleMenuGroup:
      - id: group_toggle_msg
        type: DisplayMessage
        params:
          content: Menu group toggled
          status: info
```

```yaml
- id: link_style_custom
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: lsc_featured
        type: MenuLink
        style:
          fontWeight: bold
          color: "#1677ff"
        properties:
          title: Featured
          icon: AiOutlineStar
      - id: lsc_regular
        type: MenuLink
        properties:
          title: Regular Item
          icon: AiOutlineFile
      - id: lsc_muted
        type: MenuLink
        style:
          opacity: 0.6
          fontStyle: italic
        properties:
          title: Archived
          icon: AiOutlineFolder
- id: link_style_icon_object
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: lsi_alert
        type: MenuLink
        properties:
          title: Alerts
          icon:
            name: AiOutlineBell
            color: "#faad14"
      - id: lsi_success
        type: MenuLink
        properties:
          title: Completed
          icon:
            name: AiOutlineCheckCircle
            color: "#52c41a"
      - id: lsi_error
        type: MenuLink
        properties:
          title: Errors
          icon:
            name: AiOutlineCloseCircle
            color: "#ff4d4f"
```

```yaml
- id: css_tailwind_shadow
  type: MobileMenu
  layout:
    flex: 0 0 auto
  class: shadow-md rounded-lg
  properties:
    links:
      - id: cts_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: cts_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
- id: css_tailwind_bg
  type: MobileMenu
  layout:
    flex: 0 0 auto
  class: bg-bg-layout p-1 rounded-md
  properties:
    links:
      - id: ctb_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: ctb_explore
        type: MenuLink
        properties:
          title: Explore
          icon: AiOutlineCompass
- id: css_inline_style
  type: MobileMenu
  layout:
    flex: 0 0 auto
  style:
    .element:
      padding: 4px
      borderRadius: 8
      border: "1px solid #d6e4ff"
  properties:
    links:
      - id: cis_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: cis_help
        type: MenuLink
        properties:
          title: Help
          icon: AiOutlineQuestionCircle
- id: css_dark_context
  type: Box
  class: bg-gradient-to-r from-slate-900 to-slate-700 p-4 rounded-lg
  layout:
    gap: 8
  blocks:
    - id: css_on_dark
      type: MobileMenu
      layout:
        flex: 0 0 auto
      properties:
        theme: dark
        toggleMenuButton:
          type: primary
          ghost: true
          icon: AiOutlineMenu
        links:
          - id: cod_home
            type: MenuLink
            properties:
              title: Home
              icon: AiOutlineHome
          - id: cod_settings
            type: MenuLink
            properties:
              title: Settings
              icon: AiOutlineSetting
```

```yaml
- id: mobile_shortcut
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    drawer:
      title: Navigation
    links:
      - id: ms_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
          shortcut: mod+1
      - id: ms_search
        type: MenuLink
        properties:
          title: Search
          icon: AiOutlineSearch
          shortcut: mod+k
      - id: ms_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
          shortcut: mod+,
```

```yaml
- id: mm_logo_example
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    logo:
      src: logo-square-dark-theme.png
      alt: Lowdefy
      style:
        width: 60
    links:
      - id: ml_home
        type: MenuLink
        properties:
          title: Home
          icon: AiOutlineHome
      - id: ml_settings
        type: MenuLink
        properties:
          title: Settings
          icon: AiOutlineSetting
```

Additional content below the menu items.

```yaml
- id: mm_drawer_content_example
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: mdc_home
        type: MenuLink
        properties:
          title: Home
      - id: mdc_about
        type: MenuLink
        properties:
          title: About
  slots:
    drawerContent:
      blocks:
        - id: mdc_extra
          type: Paragraph
          style:
            padding: 16px
            color: "#999"
          properties:
            content: Additional content below the menu items.
```

App v2.1.0

```yaml
- id: mm_drawer_footer_example
  type: MobileMenu
  layout:
    flex: 0 0 auto
  properties:
    links:
      - id: mdf_home
        type: MenuLink
        properties:
          title: Home
  slots:
    drawerFooter:
      blocks:
        - id: mdf_footer
          type: Paragraph
          style:
            textAlign: center
            margin: 0
            color: "#aaa"
            fontSize: 12
          properties:
            content: App v2.1.0
```

**Admin Panel**

You have **12** new orders, **3** pending reviews, and **5** unread messages.

Use the navigation menu to manage your application.

```yaml
- id: admin_header
  type: Box
  class: bg-bg-container border-b border-border px-4 py-3
  layout:
    direction: row
    align: center
    justify: space-between
  blocks:
    - id: admin_left
      type: Box
      layout:
        direction: row
        align: center
        gap: 12
        flex: 0 0 auto
      blocks:
        - id: admin_nav
          type: MobileMenu
          layout:
            flex: 0 0 auto
          properties:
            toggleMenuButton:
              type: text
              icon: AiOutlineMenu
            drawer:
              title: Admin Panel
              width: 280
            links:
              - id: an_dashboard
                type: MenuLink
                properties:
                  title: Dashboard
                  icon: AiOutlineDashboard
              - id: an_content
                type: MenuGroup
                properties:
                  title: Content
                  icon: AiOutlineFileText
                links:
                  - id: an_posts
                    type: MenuLink
                    properties:
                      title: Posts
                  - id: an_media
                    type: MenuLink
                    properties:
                      title: Media Library
              - id: an_users
                type: MenuGroup
                properties:
                  title: Users
                  icon: AiOutlineTeam
                links:
                  - id: an_all_users
                    type: MenuLink
                    properties:
                      title: All Users
                  - id: an_roles
                    type: MenuLink
                    properties:
                      title: Roles
              - id: an_divider
                type: MenuDivider
              - id: an_settings
                type: MenuLink
                properties:
                  title: Settings
                  icon: AiOutlineSetting
              - id: an_divider2
                type: MenuDivider
                properties:
                  dashed: true
              - id: an_logout
                type: MenuLink
                properties:
                  title: Sign Out
                  icon: AiOutlineLogout
                  danger: true
          events:
            onMenuItemClick:
              - id: admin_click_msg
                type: DisplayMessage
                params:
                  content: Navigating...
                  status: info
        - id: admin_title
          type: Markdown
          layout:
            flex: 0 0 auto
          properties:
            content: "**Admin Panel**"
    - id: admin_actions
      type: Box
      layout:
        direction: row
        align: center
        gap: 8
        flex: 0 0 auto
      blocks:
        - id: admin_bell
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineBell
            hideTitle: true
            variant: text
            color: default
        - id: admin_avatar
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineUser
            hideTitle: true
            shape: circle
            variant: filled
            color: primary
- id: admin_body
  type: Card
  properties:
    title: Welcome Back
    size: small
  blocks:
    - id: admin_stats
      type: Markdown
      properties:
        content: >
          You have **12** new orders, **3** pending reviews, and **5** unread
          messages.


          Use the navigation menu to manage your application.
```

**ShopNow**

Browse our latest collection across all categories.

**Free shipping** on orders over $50. Use the menu to explore departments.

```yaml
- id: shop_header
  type: Box
  class: bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3
  layout:
    direction: row
    align: center
    justify: space-between
  blocks:
    - id: shop_left
      type: Box
      layout:
        direction: row
        align: center
        gap: 12
        flex: 0 0 auto
      blocks:
        - id: shop_nav
          type: MobileMenu
          layout:
            flex: 0 0 auto
          properties:
            toggleMenuButton:
              type: primary
              ghost: true
              icon: AiOutlineMenu
            drawer:
              title: Shop Categories
              width: 300
            theme: light
            selectedKeys:
              - sn_clothing
            links:
              - id: sn_home
                type: MenuLink
                url: /
                properties:
                  title: Home
                  icon: AiOutlineHome
              - id: sn_divider_top
                type: MenuDivider
              - id: sn_clothing
                type: MenuGroup
                properties:
                  title: Clothing
                  icon: AiOutlineSkin
                links:
                  - id: sn_mens
                    type: MenuLink
                    properties:
                      title: Men's Wear
                  - id: sn_womens
                    type: MenuLink
                    properties:
                      title: Women's Wear
                  - id: sn_kids
                    type: MenuLink
                    properties:
                      title: Kids
              - id: sn_electronics
                type: MenuGroup
                properties:
                  title: Electronics
                  icon: AiOutlineLaptop
                links:
                  - id: sn_phones
                    type: MenuLink
                    properties:
                      title: Phones & Tablets
                  - id: sn_computers
                    type: MenuLink
                    properties:
                      title: Computers
              - id: sn_divider_bottom
                type: MenuDivider
                properties:
                  dashed: true
              - id: sn_deals
                type: MenuLink
                properties:
                  title: Today's Deals
                  icon: AiOutlineThunderbolt
              - id: sn_orders
                type: MenuLink
                pageId: orders
                properties:
                  title: My Orders
                  icon: AiOutlineShoppingCart
          events:
            onMenuItemSelect:
              - id: shop_select_msg
                type: DisplayMessage
                params:
                  content: Loading category...
                  status: info
            onToggleDrawer:
              - id: shop_toggle_state
                type: SetState
                params:
                  menuOpen:
                    _not:
                      _state: menuOpen
        - id: shop_brand
          type: Markdown
          layout:
            flex: 0 0 auto
          style:
            .element:
              color: white
          properties:
            content: "**ShopNow**"
    - id: shop_right
      type: Box
      layout:
        direction: row
        align: center
        gap: 8
        flex: 0 0 auto
      blocks:
        - id: shop_search
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineSearch
            hideTitle: true
            variant: text
            ghost: true
            color: default
        - id: shop_cart
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineShoppingCart
            hideTitle: true
            variant: text
            ghost: true
            color: default
- id: shop_content
  type: Card
  properties:
    title: Featured Products
    size: small
  blocks:
    - id: shop_desc
      type: Markdown
      properties:
        content: >
          Browse our latest collection across all categories.


          **Free shipping** on orders over $50. Use the menu to explore
          departments.
```

```yaml
- id: shop_header
  type: Box
  class: bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3
  layout:
    direction: row
    align: center
    justify: space-between
  blocks:
    - id: shop_left
      type: Box
      layout:
        direction: row
        align: center
        gap: 12
        flex: 0 0 auto
      blocks:
        - id: shop_nav
          type: MobileMenu
          layout:
            flex: 0 0 auto
          properties:
            toggleMenuButton:
              type: primary
              ghost: true
              icon: AiOutlineMenu
            drawer:
              title: Shop Categories
              width: 300
            theme: light
            selectedKeys:
              - sn_clothing
            links:
              - id: sn_home
                type: MenuLink
                url: /
                properties:
                  title: Home
                  icon: AiOutlineHome
              - id: sn_divider_top
                type: MenuDivider
              - id: sn_clothing
                type: MenuGroup
                properties:
                  title: Clothing
                  icon: AiOutlineSkin
                links:
                  - id: sn_mens
                    type: MenuLink
                    properties:
                      title: Men's Wear
                  - id: sn_womens
                    type: MenuLink
                    properties:
                      title: Women's Wear
                  - id: sn_kids
                    type: MenuLink
                    properties:
                      title: Kids
              - id: sn_electronics
                type: MenuGroup
                properties:
                  title: Electronics
                  icon: AiOutlineLaptop
                links:
                  - id: sn_phones
                    type: MenuLink
                    properties:
                      title: Phones & Tablets
                  - id: sn_computers
                    type: MenuLink
                    properties:
                      title: Computers
              - id: sn_divider_bottom
                type: MenuDivider
                properties:
                  dashed: true
              - id: sn_deals
                type: MenuLink
                properties:
                  title: Today's Deals
                  icon: AiOutlineThunderbolt
              - id: sn_orders
                type: MenuLink
                pageId: orders
                properties:
                  title: My Orders
                  icon: AiOutlineShoppingCart
          events:
            onMenuItemSelect:
              - id: shop_select_msg
                type: DisplayMessage
                params:
                  content: Loading category...
                  status: info
            onToggleDrawer:
              - id: shop_toggle_state
                type: SetState
                params:
                  menuOpen:
                    _not:
                      _state: menuOpen
        - id: shop_brand
          type: Markdown
          layout:
            flex: 0 0 auto
          style:
            .element:
              color: white
          properties:
            content: "**ShopNow**"
    - id: shop_right
      type: Box
      layout:
        direction: row
        align: center
        gap: 8
        flex: 0 0 auto
      blocks:
        - id: shop_search
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineSearch
            hideTitle: true
            variant: text
            ghost: true
            color: default
        - id: shop_cart
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            icon: AiOutlineShoppingCart
            hideTitle: true
            variant: text
            ghost: true
            color: default
- id: shop_content
  type: Card
  properties:
    title: Featured Products
    size: small
  blocks:
    - id: shop_desc
      type: Markdown
      properties:
        content: >
          Browse our latest collection across all categories.


          **Free shipping** on orders over $50. Use the menu to explore
          departments.
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `toggleMenuButton` | object | - | Toggle menu button properties. |
| `drawer` | object | - | Menu drawer properties. |
| `logo` | object | - | Logo settings for the mobile menu drawer header. |
| `logo.src` | string | - | Logo source url. |
| `logo.srcMobile` | string | - | Mobile logo source url. |
| `logo.alt` | string | `"Lowdefy"` | Logo alternative text. |
| `logo.style` | object | - | Css style object to apply to logo. |
| `menuId` | string | - | App menu id used to get menu links. |
| `selectedKeys` | array | - | Array with the keys of currently selected menu items. |
| `subMenuCloseDelay` | number | - | Delay time to hide submenu when mouse leaves (in seconds). |
| `subMenuOpenDelay` | number | - | Delay time to show submenu when mouse enters (in seconds). |
| `theme` | string | `"light"` | Color theme of menu. Enum: `dark`, `light`. |
| `links` | array | - |  |
| `links.$.id` | string | - | Menu item id. |
| `links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `links.$.pageId` | string | - | Page to link to. |
| `links.$.style` | object | - | Css style to applied to link. |
| `links.$.properties` | object | - | properties from menu item. |
| `links.$.properties.title` | string | - | Menu item title. |
| `links.$.properties.icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon on menu item. |
| `links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `links.$.links` | array | - |  |
| `links.$.links.$.id` | string | - | Menu item id. |
| `links.$.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`, `MenuGroup`. |
| `links.$.links.$.style` | object | - | Css style to applied to sub-link. |
| `links.$.links.$.pageId` | string | - | Page to link to. |
| `links.$.links.$.properties` | object | - | properties from menu item. |
| `links.$.links.$.properties.title` | string | - | Menu item title. |
| `links.$.links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `links.$.links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |
| `links.$.links.$.links` | array | - |  |
| `links.$.links.$.links.$.id` | string | - | Menu item id. |
| `links.$.links.$.links.$.type` | string | `"MenuLink"` | Menu item type. Enum: `MenuDivider`, `MenuLink`. |
| `links.$.links.$.links.$.style` | object | - | Css style to applied to sub-link. |
| `links.$.links.$.links.$.pageId` | string | - | Page to link to. |
| `links.$.links.$.links.$.properties` | object | - | properties from menu item. |
| `links.$.links.$.links.$.properties.title` | string | - | Menu item title. |
| `links.$.links.$.links.$.properties.danger` | boolean | `false` | Apply danger style to menu item. |
| `links.$.links.$.links.$.properties.dashed` | boolean | `false` | Whether the divider line is dashed. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onToggleDrawer` | \- | Trigger action when mobile menu drawer is toggled. |
| `onClose` | \- | Trigger action when mobile menu is closed. |
| `onOpen` | \- | Trigger action when mobile menu is opened. |
| `onMenuItemSelect` | \- | Trigger action when menu item is selected. |
| `onMenuItemClick` | \- | Trigger action when menu item is clicked. |
| `onToggleMenuGroup` | \- | Trigger action when mobile menu group is opened. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The MobileMenu element. |

| Slot | Description |
| --- | --- |
| `drawerContent` | Additional content below the menu in the drawer. |
| `drawerFooter` | Footer content in the drawer. |
