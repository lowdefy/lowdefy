<TITLE>
_menu
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_menu` operator retrieves menu objects defined in the [`menus`](/lowdefy-schema) section of the Lowdefy configuration. This allows you to access menu structures dynamically for custom navigation components, role-based menu filtering, or menu data display.

Menu objects contain the full menu structure including:

- Menu ID and properties
- Links array with page references
- Nested menu groups and their child links
- Menu item properties like titles, icons, and visibility settings
  </DESCRIPTION>

<SCHEMA>
```yaml
_menu:
  type: string | number | boolean | object
  description: Access menu objects from the menus configuration.
  oneOf:
    - type: string
      description: The menuId of the menu to retrieve.
    - type: number
      description: The index of the menu to retrieve (0-based).
    - type: boolean
      description: If true, returns all menus as an array.
    - type: object
      properties:
        value:
          type: string
          description: The menuId of the menu to retrieve.
        index:
          type: number
          description: The index of the menu to retrieve.
        all:
          type: boolean
          description: If true, returns all menus as an array.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Get a specific menu by ID

Retrieve a named menu for custom rendering.

```yaml
id: quick_links_section
type: Card
properties:
  title: Quick Links
blocks:
  - id: links_list
    type: List
    properties:
      data:
        _menu: quick_links
    blocks:
      - id: link_item.$
        type: Button
        properties:
          title:
            _state: links.$.properties.title
          icon:
            _state: links.$.properties.icon
          type: link
        events:
          onClick:
            - id: navigate
              type: Link
              params:
                pageId:
                  _state: links.$.pageId
```

---

###### Example 2: Get all menus for navigation component

Access the complete menu structure for a custom navigation.

```yaml
id: custom_nav
type: Box
blocks:
  - id: menu_selector
    type: ButtonSelector
    properties:
      title: Navigation
      options:
        _array.map:
          - _menu: true
          - _function:
              label: __args.0.id
              value: __args.0.id
  - id: selected_menu_links
    type: List
    properties:
      data:
        _array.find:
          on:
            _menu:
              all: true
          find:
            _function:
              __eq:
                - __args.0.id
                - _state: menu_selector
    blocks:
      - id: menu_link.$
        type: Paragraph
        properties:
          content:
            _state: links.$.properties.title
```

---

###### Example 3: Get menu by index

Retrieve menus by their position in the menus array.

```yaml
id: primary_nav
type: Box
blocks:
  - id: main_menu
    type: Menu
    properties:
      # Use the first menu (index 0) as primary navigation
      links:
        _menu: 0

id: secondary_nav
type: Box
blocks:
  - id: secondary_menu
    type: Menu
    properties:
      # Use the second menu (index 1) as secondary navigation
      links:
        _menu: 1
```

---

###### Example 4: Dynamic menu filtering based on user roles

Filter menu items based on user permissions.

```yaml
id: role_filtered_nav
type: Card
properties:
  title: Your Menu
blocks:
  - id: filtered_links
    type: List
    properties:
      data:
        _array.filter:
          on:
            _array.flat:
              - _array.map:
                  - _menu: default
                  - _function:
                      __if_none:
                        - __args.0.links
                        - - __args.0
          find:
            _function:
              __or:
                - __eq:
                    - __args.0.properties.requiredRole
                    - null
                - __array.includes:
                    - _user: roles
                    - __args.0.properties.requiredRole
    blocks:
      - id: nav_link.$
        type: Button
        properties:
          title:
            _state: nav_links.$.properties.title
          icon:
            _state: nav_links.$.properties.icon
          block: true
        events:
          onClick:
            - id: go_to_page
              type: Link
              params:
                pageId:
                  _state: nav_links.$.pageId
```

---

###### Example 5: Building a sitemap from menu configuration

Create a complete sitemap display using menu data.

```yaml
id: sitemap_page
type: PageHeaderMenu
properties:
  title: Sitemap
blocks:
  - id: sitemap_container
    type: Box
    layout:
      contentGutter: 24
    blocks:
      - id: menus_display
        type: List
        properties:
          data:
            _menu:
              all: true
        blocks:
          - id: menu_section.$
            type: Card
            properties:
              title:
                _string.concat:
                  - 'Menu: '
                  - _state: menus.$.id
            blocks:
              - id: menu_groups.$
                type: List
                properties:
                  data:
                    _if_none:
                      - _state: menus.$.links
                      - []
                blocks:
                  - id: link_or_group.$.$
                    type: Box
                    blocks:
                      # Display as group if it has nested links
                      - id: group_title.$.$
                        type: Title
                        visible:
                          _ne:
                            - _state: menus.$.links.$.links
                            - null
                        properties:
                          level: 4
                          content:
                            _if_none:
                              - _state: menus.$.links.$.properties.title
                              - _state: menus.$.links.$.id

                      # Show child links if this is a group
                      - id: child_links.$.$
                        type: List
                        visible:
                          _ne:
                            - _state: menus.$.links.$.links
                            - null
                        properties:
                          data:
                            _state: menus.$.links.$.links
                        blocks:
                          - id: child_link.$.$.$
                            type: Button
                            properties:
                              title:
                                _state: menus.$.links.$.links.$.properties.title
                              type: link
                              size: small
                            events:
                              onClick:
                                - id: navigate
                                  type: Link
                                  params:
                                    pageId:
                                      _state: menus.$.links.$.links.$.pageId

                      # Show as direct link if no nested links
                      - id: direct_link.$.$
                        type: Button
                        visible:
                          _eq:
                            - _state: menus.$.links.$.links
                            - null
                        properties:
                          title:
                            _if_none:
                              - _state: menus.$.links.$.properties.title
                              - _state: menus.$.links.$.id
                          type: link
                        events:
                          onClick:
                            - id: go_to_page
                              type: Link
                              params:
                                pageId:
                                  _state: menus.$.links.$.pageId
```

</EXAMPLES>
