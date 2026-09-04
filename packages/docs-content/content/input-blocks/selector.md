# Selector

Dropdown selector with search, clear, and custom icons.

```yaml
- id: basic_selector
  type: Selector
  properties:
    title: Favorite Fruit
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
      - label: Dragonfruit
        value: dragonfruit
      - label: Elderberry
        value: elderberry
- id: basic_placeholder
  type: Selector
  properties:
    title: Country
    placeholder: Choose a country...
    options:
      - label: United States
        value: us
      - label: United Kingdom
        value: uk
      - label: Canada
        value: ca
      - label: Australia
        value: au
      - label: Germany
        value: de
```

```yaml
basic_selector:
  _state: basic_selector
basic_placeholder:
  _state: basic_placeholder
```

```yaml
- id: string_options
  type: Selector
  properties:
    title: Simple Strings
    placeholder: Pick a color...
    options:
      - Red
      - Orange
      - Yellow
      - Green
      - Blue
      - Indigo
      - Violet
- id: number_options_mixed
  type: Selector
  properties:
    title: Quantities
    placeholder: Choose quantity...
    options:
      - label: One item
        value: 1
      - label: Five items
        value: 5
      - label: Ten items
        value: 10
      - label: Twenty-five items
        value: 25
      - label: One hundred items
        value: 100
- id: html_labels
  type: Selector
  properties:
    title: HTML Labels
    placeholder: Select a priority...
    options:
      - label: '<span style="color: #f5222d; font-weight: bold;">Critical</span>'
        value: critical
      - label: '<span style="color: #fa8c16; font-weight: bold;">High</span>'
        value: high
      - label: '<span style="color: #fadb14; font-weight: bold;">Medium</span>'
        value: medium
      - label: '<span style="color: #52c41a; font-weight: bold;">Low</span>'
        value: low
      - label: '<span style="color: #8c8c8c;">None</span>'
        value: none
- id: styled_options
  type: Selector
  properties:
    title: Color Swatches
    placeholder: Pick a theme color...
    options:
      - label: Ocean Blue
        value: ocean
        style:
          color: "#1677ff"
          fontWeight: bold
      - label: Forest Green
        value: forest
        style:
          color: "#52c41a"
          fontWeight: bold
      - label: Sunset Orange
        value: sunset
        style:
          color: "#fa8c16"
          fontWeight: bold
      - label: Berry Purple
        value: berry
        style:
          color: "#722ed1"
          fontWeight: bold
      - label: Coral Red
        value: coral
        style:
          color: "#f5222d"
          fontWeight: bold
- id: disabled_options
  type: Selector
  properties:
    title: Product Availability
    placeholder: Select a product...
    options:
      - label: Widget A - In Stock
        value: widget_a
      - label: Widget B - Sold Out
        value: widget_b
        disabled: true
      - label: Widget C - In Stock
        value: widget_c
      - label: Widget D - Coming Soon
        value: widget_d
        disabled: true
      - label: Widget E - In Stock
        value: widget_e
```

```yaml
string_options:
  _state: string_options
number_options_mixed:
  _state: number_options_mixed
html_labels:
  _state: html_labels
styled_options:
  _state: styled_options
disabled_options:
  _state: disabled_options
```

```yaml
- id: filter_string
  type: Selector
  properties:
    title: Country (Search by Name or Code)
    showSearch: true
    placeholder: Type name or country code...
    options:
      - label: United States
        value: us
        filterString: United States US USA America
      - label: United Kingdom
        value: uk
        filterString: United Kingdom UK GB Britain England
      - label: Canada
        value: ca
        filterString: Canada CA
      - label: Australia
        value: au
        filterString: Australia AU Aussie
      - label: Germany
        value: de
        filterString: Germany DE Deutschland
      - label: France
        value: fr
        filterString: France FR
      - label: Japan
        value: jp
        filterString: Japan JP Nippon
      - label: Brazil
        value: br
        filterString: Brazil BR Brasil
- id: filter_string_html
  type: Selector
  properties:
    title: Employee (Search by Name or Department)
    showSearch: true
    placeholder: Search employees...
    options:
      - label: <b>Alice Johnson</b> - <small>Engineering</small>
        value: alice
        filterString: Alice Johnson Engineering Frontend
      - label: <b>Bob Smith</b> - <small>Design</small>
        value: bob
        filterString: Bob Smith Design UI UX
      - label: <b>Carol Williams</b> - <small>Marketing</small>
        value: carol
        filterString: Carol Williams Marketing Content
      - label: <b>Dave Brown</b> - <small>Sales</small>
        value: dave
        filterString: Dave Brown Sales Account
- id: search_disabled
  type: Selector
  properties:
    title: Non-Searchable
    showSearch: false
    placeholder: Select without search...
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
```

```yaml
filter_string:
  _state: filter_string
filter_string_html:
  _state: filter_string_html
search_disabled:
  _state: search_disabled
```

```yaml
- id: allow_clear_false
  type: Selector
  properties:
    title: Not Clearable
    allowClear: false
    placeholder: Cannot be cleared once set...
    options:
      - label: Red
        value: red
      - label: Green
        value: green
      - label: Blue
        value: blue
- id: bordered_false
  type: Selector
  properties:
    title: Borderless
    bordered: false
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: arrow_hidden
  type: Selector
  properties:
    title: Arrow Hidden
    showArrow: false
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
      - label: Gamma
        value: gamma
- id: disabled_selector
  type: Selector
  properties:
    title: Fully Disabled
    disabled: true
    placeholder: This selector is disabled
    options:
      - label: Option A
        value: a
      - label: Option B
        value: b
      - label: Option C
        value: c
- id: no_label_selector
  type: Selector
  properties:
    label:
      disabled: true
    placeholder: Select a color...
    options:
      - label: Red
        value: red
      - label: Orange
        value: orange
      - label: Yellow
        value: yellow
      - label: Green
        value: green
      - label: Blue
        value: blue
```

```yaml
allow_clear_false:
  _state: allow_clear_false
bordered_false:
  _state: bordered_false
arrow_hidden:
  _state: arrow_hidden
disabled_selector:
  _state: disabled_selector
no_label_selector:
  _state: no_label_selector
```

```yaml
- id: size_small
  type: Selector
  properties:
    title: Small
    size: small
    placeholder: Small selector...
    options:
      - Apple
      - Banana
      - Cherry
      - Date
      - Elderberry
- id: size_default
  type: Selector
  properties:
    title: Default
    placeholder: Default selector...
    options:
      - Apple
      - Banana
      - Cherry
      - Date
      - Elderberry
- id: size_large
  type: Selector
  properties:
    title: Large
    size: large
    placeholder: Large selector...
    options:
      - Apple
      - Banana
      - Cherry
      - Date
      - Elderberry
```

```yaml
size_small:
  _state: size_small
size_default:
  _state: size_default
size_large:
  _state: size_large
```

```yaml
- id: custom_suffix_icon
  type: Selector
  properties:
    title: Custom Suffix Icon
    suffixIcon: AiOutlineSearch
    placeholder: Search items...
    options:
      - label: Database
        value: database
      - label: Server
        value: server
      - label: Cloud
        value: cloud
- id: custom_suffix_icon_object
  type: Selector
  properties:
    title: Styled Suffix Icon
    suffixIcon:
      name: AiOutlineFilter
      color: "#722ed1"
    placeholder: Filter options...
    options:
      - label: All Items
        value: all
      - label: Active Only
        value: active
      - label: Archived
        value: archived
- id: custom_clear_icon
  type: Selector
  properties:
    title: Custom Clear Icon
    clearIcon: AiOutlineDelete
    placeholder: Select to see custom clear icon...
    options:
      - label: Item One
        value: one
      - label: Item Two
        value: two
      - label: Item Three
        value: three
- id: custom_clear_icon_object
  type: Selector
  properties:
    title: Styled Clear Icon
    clearIcon:
      name: AiOutlineCloseCircle
      color: "#f5222d"
    placeholder: Select then hover to clear...
    options:
      - label: First
        value: first
      - label: Second
        value: second
      - label: Third
        value: third
```

```yaml
custom_suffix_icon:
  _state: custom_suffix_icon
custom_suffix_icon_object:
  _state: custom_suffix_icon_object
custom_clear_icon:
  _state: custom_clear_icon
custom_clear_icon_object:
  _state: custom_clear_icon_object
```

```yaml
- id: placeholder_default
  type: Selector
  properties:
    title: Default Placeholder
    options:
      - Apple
      - Banana
      - Cherry
- id: placeholder_custom
  type: Selector
  properties:
    title: Custom Placeholder
    placeholder: Please choose a fruit...
    options:
      - Apple
      - Banana
      - Cherry
- id: loading_placeholder
  type: Selector
  properties:
    title: Loading Placeholder
    loadingPlaceholder: Fetching results...
    placeholder: Search with onSearch event...
    showSearch: true
    options:
      - label: Result A
        value: a
      - label: Result B
        value: b
- id: not_found_content
  type: Selector
  properties:
    title: Custom Not Found
    notFoundContent: No matching items found
    showSearch: true
    placeholder: Type something that does not match...
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
```

```yaml
placeholder_default:
  _state: placeholder_default
placeholder_custom:
  _state: placeholder_custom
loading_placeholder:
  _state: loading_placeholder
not_found_content:
  _state: not_found_content
```

```yaml
- id: label_default
  type: Selector
  properties:
    title: Default Label
    options:
      - Apple
      - Banana
      - Cherry
- id: label_no_colon
  type: Selector
  properties:
    title: No Colon
    label:
      colon: false
    options:
      - Apple
      - Banana
      - Cherry
- id: label_inline
  type: Selector
  properties:
    title: Inline Label
    label:
      inline: true
      span: 8
    options:
      - Apple
      - Banana
      - Cherry
- id: label_inline_right
  type: Selector
  properties:
    title: Inline Right
    label:
      inline: true
      span: 8
      align: right
    options:
      - Apple
      - Banana
      - Cherry
- id: label_extra
  type: Selector
  properties:
    title: With Extra Text
    label:
      extra: Select your preferred fruit from the list.
    options:
      - Apple
      - Banana
      - Cherry
```

```yaml
label_default:
  _state: label_default
label_no_colon:
  _state: label_no_colon
label_inline:
  _state: label_inline
label_inline_right:
  _state: label_inline_right
label_extra:
  _state: label_extra
```

```yaml
- id: css_element
  type: Selector
  properties:
    title: Styled Element
    placeholder: Custom styled selector...
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
  style:
    .element:
      borderColor: "#4096ff"
      borderRadius: 8
- id: css_label
  type: Selector
  properties:
    title: Styled Label
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
  style:
    .label:
      color: "#722ed1"
      fontWeight: bold
      fontSize: 16
- id: css_extra
  type: Selector
  properties:
    title: Styled Extra
    label:
      extra: This extra text has custom styling.
    options:
      - Red
      - Green
      - Blue
  style:
    .extra:
      color: "#8c8c8c"
      fontStyle: italic
- id: css_options
  type: Selector
  properties:
    title: Styled Options
    placeholder: Options have custom padding...
    options:
      - label: Styled Option A
        value: a
      - label: Styled Option B
        value: b
      - label: Styled Option C
        value: c
  style:
    .options:
      padding: 8px 16px
      fontSize: 15
```

```yaml
css_element:
  _state: css_element
css_label:
  _state: css_label
css_extra:
  _state: css_extra
css_options:
  _state: css_options
```

```yaml
- id: class_element
  type: Selector
  properties:
    title: Tailwind Classes
    placeholder: Select with classes...
    options:
      - label: One
        value: 1
      - label: Two
        value: 2
      - label: Three
        value: 3
  class:
    element: rounded-lg shadow-sm
- id: class_label
  type: Selector
  properties:
    title: Styled Label Class
    options:
      - label: Alpha
        value: alpha
      - label: Beta
        value: beta
  class:
    label: text-blue-600 font-semibold
```

```yaml
class_element:
  _state: class_element
class_label:
  _state: class_label
```

```yaml
- id: many_options
  type: Selector
  properties:
    title: Long List
    showSearch: true
    placeholder: Scroll or search through many options...
    options:
      - label: Afghanistan
        value: AF
      - label: Albania
        value: AL
      - label: Algeria
        value: DZ
      - label: Argentina
        value: AR
      - label: Australia
        value: AU
      - label: Austria
        value: AT
      - label: Belgium
        value: BE
      - label: Brazil
        value: BR
      - label: Canada
        value: CA
      - label: Chile
        value: CL
      - label: China
        value: CN
      - label: Colombia
        value: CO
      - label: Czech Republic
        value: CZ
      - label: Denmark
        value: DK
      - label: Egypt
        value: EG
      - label: Finland
        value: FI
      - label: France
        value: FR
      - label: Germany
        value: DE
      - label: Greece
        value: GR
      - label: India
        value: IN
      - label: Indonesia
        value: ID
      - label: Ireland
        value: IE
      - label: Italy
        value: IT
      - label: Japan
        value: JP
      - label: Mexico
        value: MX
      - label: Netherlands
        value: NL
      - label: New Zealand
        value: NZ
      - label: Norway
        value: NO
      - label: Poland
        value: PL
      - label: Portugal
        value: PT
      - label: Russia
        value: RU
      - label: South Africa
        value: ZA
      - label: South Korea
        value: KR
      - label: Spain
        value: ES
      - label: Sweden
        value: SE
      - label: Switzerland
        value: CH
      - label: Thailand
        value: TH
      - label: Turkey
        value: TR
      - label: United Kingdom
        value: GB
      - label: United States
        value: US
      - label: Vietnam
        value: VN
```

```yaml
many_options:
  _state: many_options
```

```yaml
- id: theme_custom_colors
  type: Selector
  properties:
    title: Custom Selection Colors
    placeholder: Select to see custom highlight...
    options:
      - label: Apple
        value: apple
      - label: Banana
        value: banana
      - label: Cherry
        value: cherry
      - label: Date
        value: date
      - label: Elderberry
        value: elderberry
    theme:
      optionSelectedColor: "#722ed1"
      optionSelectedFontWeight: 700
- id: theme_border_colors
  type: Selector
  properties:
    title: Custom Border Colors
    placeholder: Focus to see border color...
    options:
      - label: Red
        value: red
      - label: Green
        value: green
      - label: Blue
        value: blue
    theme:
      hoverBorderColor: "#52c41a"
      activeBorderColor: "#389e0d"
      activeOutlineColor: rgba(82, 196, 26, 0.1)
- id: theme_option_size
  type: Selector
  properties:
    title: Large Options
    placeholder: Options have increased height...
    options:
      - label: Spacious Option A
        value: a
      - label: Spacious Option B
        value: b
      - label: Spacious Option C
        value: c
    theme:
      optionHeight: 44
      optionFontSize: 16
      optionLineHeight: 1.8
      optionPadding: 8px 16px
- id: theme_size_sm
  type: Selector
  properties:
    title: Custom Small
    size: small
    placeholder: Custom small selector...
    options:
      - Alpha
      - Beta
      - Gamma
    theme:
      controlHeightSM: 20
      borderRadiusSM: 2
      fontSizeSM: 12
- id: theme_combined
  type: Selector
  properties:
    title: Fully Customized
    placeholder: Purple themed selector...
    options:
      - label: Dashboard
        value: dashboard
      - label: Analytics
        value: analytics
      - label: Reports
        value: reports
      - label: Settings
        value: settings
    theme:
      colorPrimary: "#722ed1"
      borderRadius: 12
      fontSize: 15
      optionSelectedColor: "#531dab"
      hoverBorderColor: "#b37feb"
      activeBorderColor: "#722ed1"
      activeOutlineColor: rgba(114, 46, 209, 0.1)
      optionHeight: 40
```

```yaml
theme_custom_colors:
  _state: theme_custom_colors
theme_border_colors:
  _state: theme_border_colors
theme_option_size:
  _state: theme_option_size
theme_size_sm:
  _state: theme_size_sm
theme_combined:
  _state: theme_combined
```

```yaml
- id: combined_search_styled
  type: Selector
  properties:
    title: Searchable Styled Options
    showSearch: true
    placeholder: Search and select a status...
    suffixIcon: AiOutlineSearch
    options:
      - label: '<span style="color: #52c41a;">Active</span>'
        value: active
        filterString: Active Running Live
      - label: '<span style="color: #faad14;">Pending</span>'
        value: pending
        filterString: Pending Waiting Queue
      - label: '<span style="color: #f5222d;">Error</span>'
        value: error
        filterString: Error Failed Broken
      - label: '<span style="color: #8c8c8c;">Archived</span>'
        value: archived
        filterString: Archived Old Removed
        disabled: true
- id: combined_large_custom
  type: Selector
  properties:
    title: Large Custom Selector
    size: large
    showSearch: true
    placeholder: Choose a department...
    suffixIcon:
      name: AiOutlineTeam
      color: "#1677ff"
    clearIcon:
      name: AiOutlineClose
      color: "#ff4d4f"
    options:
      - label: <b>Engineering</b>
        value: engineering
        filterString: Engineering Dev Software
      - label: <b>Design</b>
        value: design
        filterString: Design UI UX Creative
      - label: <b>Marketing</b>
        value: marketing
        filterString: Marketing Growth Brand
      - label: <b>Sales</b>
        value: sales
        filterString: Sales Revenue Business
      - label: <b>Support</b>
        value: support
        filterString: Support Help Customer Service
    theme:
      borderRadius: 12
      optionHeight: 40
- id: combined_borderless_small
  type: Selector
  properties:
    title: Compact Borderless
    size: small
    bordered: false
    showSearch: false
    showArrow: true
    placeholder: Quick pick...
    options:
      - label: Today
        value: today
      - label: This Week
        value: week
      - label: This Month
        value: month
      - label: This Year
        value: year
- id: combined_inline_themed
  type: Selector
  properties:
    title: Inline Themed
    label:
      inline: true
      span: 6
      colon: false
    placeholder: Select role...
    options:
      - label: Admin
        value: admin
      - label: Editor
        value: editor
      - label: Viewer
        value: viewer
    theme:
      colorPrimary: "#13c2c2"
      borderRadius: 8
      hoverBorderColor: "#13c2c2"
      activeBorderColor: "#08979c"
```

```yaml
combined_search_styled:
  _state: combined_search_styled
combined_large_custom:
  _state: combined_large_custom
combined_borderless_small:
  _state: combined_borderless_small
combined_inline_themed:
  _state: combined_inline_themed
```

```yaml
- id: applied2_registration_card
  type: Card
  properties:
    title: User Preferences
  blocks:
    - id: applied2_reg_country
      type: Selector
      properties:
        title: Country
        showSearch: true
        placeholder: Select your country...
        suffixIcon: AiOutlineGlobal
        options:
          - label: United States
            value: us
          - label: United Kingdom
            value: uk
          - label: Canada
            value: ca
          - label: Australia
            value: au
          - label: Germany
            value: de
          - label: France
            value: fr
          - label: Japan
            value: jp
          - label: Brazil
            value: br
          - label: South Africa
            value: za
    - id: applied2_reg_language
      type: Selector
      properties:
        title: Preferred Language
        placeholder: Select language...
        options:
          - label: English
            value: en
          - label: Spanish
            value: es
          - label: French
            value: fr
          - label: German
            value: de
          - label: Japanese
            value: ja
          - label: Portuguese
            value: pt
    - id: applied2_reg_timezone
      type: Selector
      properties:
        title: Timezone
        showSearch: true
        placeholder: Select your timezone...
        suffixIcon: AiOutlineClockCircle
        label:
          extra: Used for scheduling and notifications.
        options:
          - label: UTC-8 Pacific Time
            value: america_los_angeles
          - label: UTC-5 Eastern Time
            value: america_new_york
          - label: UTC+0 London
            value: europe_london
          - label: UTC+1 Berlin
            value: europe_berlin
          - label: UTC+8 Singapore
            value: asia_singapore
          - label: UTC+9 Tokyo
            value: asia_tokyo
          - label: UTC+10 Sydney
            value: australia_sydney
    - id: applied2_reg_save_btn
      type: Button
      properties:
        title: Save Preferences
        icon: AiOutlineSave
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: save_prefs_action
            type: DisplayMessage
            params:
              content: Your preferences have been saved.
              duration: 3
```

```yaml
applied2_registration_card:
  _state: applied2_registration_card
```

```yaml
- id: applied3_order_card
  type: Card
  properties:
    title: Place an Order
  blocks:
    - id: applied3_product
      type: Selector
      properties:
        title: Product
        showSearch: true
        placeholder: Select a product...
        suffixIcon: AiOutlineShopping
        options:
          - label: Laptop Pro 15"
            value: laptop_pro
          - label: Wireless Mouse
            value: mouse
          - label: Mechanical Keyboard
            value: keyboard
          - label: USB-C Hub
            value: hub
          - label: Monitor 27"
            value: monitor
      events:
        onChange:
          - id: set_product_state
            type: SetState
            params:
              selected_product:
                _state: applied3_product
    - id: applied3_quantity
      type: Selector
      properties:
        title: Quantity
        allowClear: false
        placeholder: Select quantity...
        options:
          - label: "1"
            value: 1
          - label: "2"
            value: 2
          - label: "5"
            value: 5
          - label: "10"
            value: 10
      events:
        onChange:
          - id: set_quantity_state
            type: SetState
            params:
              selected_quantity:
                _state: applied3_quantity
    - id: applied3_shipping
      type: Selector
      properties:
        title: Shipping Method
        placeholder: Choose shipping...
        options:
          - label: Standard (5-7 days)
            value: standard
          - label: Express (2-3 days)
            value: express
          - label: Overnight
            value: overnight
            style:
              color: "#1677ff"
              fontWeight: bold
    - id: applied3_place_order_btn
      type: Button
      properties:
        title: Place Order
        icon: AiOutlineCheckCircle
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: order_confirmation
            type: DisplayMessage
            params:
              content: Order placed successfully!
              duration: 3
```

```yaml
- id: applied3_order_card
  type: Card
  properties:
    title: Place an Order
  blocks:
    - id: applied3_product
      type: Selector
      properties:
        title: Product
        showSearch: true
        placeholder: Select a product...
        suffixIcon: AiOutlineShopping
        options:
          - label: Laptop Pro 15"
            value: laptop_pro
          - label: Wireless Mouse
            value: mouse
          - label: Mechanical Keyboard
            value: keyboard
          - label: USB-C Hub
            value: hub
          - label: Monitor 27"
            value: monitor
      events:
        onChange:
          - id: set_product_state
            type: SetState
            params:
              selected_product:
                _state: applied3_product
    - id: applied3_quantity
      type: Selector
      properties:
        title: Quantity
        allowClear: false
        placeholder: Select quantity...
        options:
          - label: "1"
            value: 1
          - label: "2"
            value: 2
          - label: "5"
            value: 5
          - label: "10"
            value: 10
      events:
        onChange:
          - id: set_quantity_state
            type: SetState
            params:
              selected_quantity:
                _state: applied3_quantity
    - id: applied3_shipping
      type: Selector
      properties:
        title: Shipping Method
        placeholder: Choose shipping...
        options:
          - label: Standard (5-7 days)
            value: standard
          - label: Express (2-3 days)
            value: express
          - label: Overnight
            value: overnight
            style:
              color: "#1677ff"
              fontWeight: bold
    - id: applied3_place_order_btn
      type: Button
      properties:
        title: Place Order
        icon: AiOutlineCheckCircle
        type: primary
        size: large
        block: true
      events:
        onClick:
          - id: order_confirmation
            type: DisplayMessage
            params:
              content: Order placed successfully!
              duration: 3
```

```yaml
applied3_order_card:
  _state: applied3_order_card
```

```yaml
- id: selector_color_solid
  type: Selector
  properties:
    title: Solid — the whole input filled with the selected option color
    variant: solid
    options:
      - label: Low
        value: low
        color: "#16a34a"
      - label: Medium
        value: medium
        color: "#d97706"
      - label: High
        value: high
        color: "#dc2626"
- id: selector_color_outlined
  type: Selector
  properties:
    title: Outlined — input border + value colored
    variant: outlined
    options:
      - label: Low
        value: low
        color: "#16a34a"
      - label: Medium
        value: medium
        color: "#d97706"
      - label: High
        value: high
        color: "#dc2626"
```

```yaml
selector_color_solid:
  _state: selector_color_solid
selector_color_outlined:
  _state: selector_color_outlined
```

```yaml
- id: data_selector
  type: Selector
  properties:
    title: Plan
    placeholder: Choose a plan...
    data:
      - id: 1
        name: Starter
      - id: 2
        name: Pro
      - id: 3
        name: Enterprise
    html: "{{ item.name }}"
    valueKey: id
```

```yaml
data_selector:
  _state: data_selector
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear the selected value, sets the value to null. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `bordered` | boolean | `true` | Whether or not the selector has a border style. Deprecated, use variant instead. |
| `clearIcon` | string \| object | `"AiOutlineCloseCircle"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input. |
| `label` | object | - | Label properties. |
| `label.align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `label.colon` | boolean | `true` | Append label with colon. |
| `label.extra` | string | - | Extra text to display beneath the content - supports html. |
| `label.title` | string | - | Label title - supports html. |
| `label.tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `label.tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `label.tooltip.icon` | string | `"AiOutlineQuestionCircle"` | Name of the icon to show beside the label. |
| `label.tooltip.color` | string | - | Color of the tooltip icon. |
| `label.span` | number | - | Label inline span. |
| `label.disabled` | boolean | `false` | Hide input label. |
| `label.hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `label.inline` | boolean | `false` | Render input and label inline. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `data` | array | - | Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request. |
| `html` | string | - | Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used. |
| `valueKey` | string | - | Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id"). |
| `primaryKey` | string | - | Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths. |
| `options` | array | `[]` | Options can either be an array of primitive values, on an array of label, value pairs - supports html. |
| `options.$.label` | string | - | Value label shown to user - supports html. |
| `options.$.value` | string \| number \| boolean \| object \| array | - | Value selected. Can be of any type. |
| `options.$.disabled` | boolean | `false` | Disable the option if true. |
| `options.$.filterString` | string | - | String to match against when filtering selector options during. If no filterString is provided the filter method matches against options.label. |
| `options.$.style` | object | - | Css style to applied to option. |
| `options.$.color` | string | - | Color applied to the selected value shown in the input, and used to tint this option in the dropdown. |
| `placeholder` | string | `"Select item"` | Placeholder text inside the block before user selects input. |
| `loadingPlaceholder` | string | `"Loading"` | Placeholder text to show in options while the block is loading. |
| `notFoundContent` | string | `"not Found"` | Placeholder text to show when list of options are empty. |
| `showArrow` | boolean | `true` | Show the suffix icon at the drop-down position of the selector. antd shows the arrow by default; `false` hides it by clearing the suffix icon. |
| `showSearch` | boolean | `true` | Make the selector options searchable. |
| `size` | string | `"default"` | Size of the block. Enum: `small`, `default`, `large`. |
| `suffixIcon` | string \| object | `"AiOutlineDown"` | Name of an React-Icon (See all icons) or properties of an Icon block to customize icon at the drop-down position of the selector. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | - | Input variant. `solid` fills the whole input with the selected option color; `outlined` colors its border/text. `filled`/`borderless` are the antd input styles. Enum: `solid`, `outlined`, `filled`, `borderless`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design select tokens](https://ant.design/components/select#design-token). |
| `theme.borderRadius` | number | `6` | Border radius of the selector. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large selectors. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small selectors. |
| `theme.clearBg` | string | `"#ffffff"` | Background color of the clear button. |
| `theme.colorBorder` | string | - | Border color of the selector. |
| `theme.colorPrimary` | string | - | Primary color override for the selector. |
| `theme.colorText` | string | - | Text color of the selector input. |
| `theme.controlHeight` | number | `32` | Height of the selector. |
| `theme.controlHeightLG` | number | `40` | Height for large selectors. |
| `theme.controlHeightSM` | number | `24` | Height for small selectors. |
| `theme.fontSize` | number | `14` | Font size of the selector input text. |
| `theme.fontSizeLG` | number | `16` | Font size for large selectors. |
| `theme.fontSizeSM` | number | `14` | Font size for small selectors. |
| `theme.hoverBorderColor` | string | `"#4096ff"` | Border color when the selector is hovered. |
| `theme.activeBorderColor` | string | `"#1677ff"` | Border color when the selector is focused or active. |
| `theme.activeOutlineColor` | string | `"rgba(5, 145, 255, 0.1)"` | Outline color when the selector is focused. |
| `theme.multipleItemBg` | string | `"rgba(0, 0, 0, 0.06)"` | Background color of selected items in multiple mode. |
| `theme.multipleItemBorderColor` | string | `"transparent"` | Border color of selected items in multiple mode. |
| `theme.multipleItemHeight` | number | `24` | Height of selected item tags in multiple mode. |
| `theme.multipleItemHeightSM` | number | `16` | Height of selected item tags in small multiple mode. |
| `theme.multipleItemHeightLG` | number | `32` | Height of selected item tags in large multiple mode. |
| `theme.multipleSelectorBgDisabled` | string | `"rgba(0, 0, 0, 0.04)"` | Background of the selector in disabled multiple mode. |
| `theme.multipleItemColorDisabled` | string | `"rgba(0, 0, 0, 0.25)"` | Text color of disabled items in multiple mode. |
| `theme.multipleItemBorderColorDisabled` | string | `"transparent"` | Border color of disabled items in multiple mode. |
| `theme.optionActiveBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of an option when hovered or active. |
| `theme.optionFontSize` | number | `14` | Font size of option text in the dropdown. |
| `theme.optionHeight` | number | `32` | Height of each option in the dropdown. |
| `theme.optionLineHeight` | number | - | Line height of option text in the dropdown. |
| `theme.optionPadding` | string \| number | `"5px 12px"` | Padding inside each option in the dropdown. |
| `theme.optionSelectedBg` | string | `"#e6f4ff"` | Background color of the selected option in the dropdown. |
| `theme.optionSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected option in the dropdown. |
| `theme.optionSelectedFontWeight` | number | `600` | Font weight of the selected option in the dropdown. |
| `theme.selectorBg` | string | `"#ffffff"` | Background color of the selector input area. |
| `theme.showArrowPaddingInlineEnd` | number | `18` | Padding at the inline end when the arrow is shown. |
| `theme.singleItemHeightLG` | number | `40` | Height of the selector input in large single mode. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger action event occurs when selector loses focus. |
| `onChange` | `{ value: any }` | Trigger action when selection is changed. |
| `onFocus` | \- | Trigger action when selector gets focus. |
| `onClear` | \- | Trigger action when selector is cleared. |
| `onSearch` | `{ value: string }` | Trigger actions when input is changed. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Selector element. |
| `/selector` | The inner value/tag container of the Selector (antd `content` semantic slot). |
| `/clearIcon` | The clear icon in the Selector. |
| `/label` | The Selector label. |
| `/extra` | The Selector extra content. |
| `/feedback` | The Selector validation feedback. |
| `/options` | The Selector options. |
| `/suffixIcon` | The suffix icon in the Selector. |

No slots defined.
