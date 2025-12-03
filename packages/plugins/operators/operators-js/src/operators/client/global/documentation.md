<TITLE>
_global
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_global` operator retrieves values from the [`global`](/page-and-app-state) object. The `global` object is a shared data store that persists across all pages in your Lowdefy application. It is defined in the `global` section of your `lowdefy.yaml` configuration file.

Use `global` for:

- Application-wide configuration settings
- Theme colors and styling constants
- Shared enum/option lists used across multiple pages
- Feature flags and environment-specific settings
- Common label translations

Unlike `state`, which is page-specific and resets when navigating, `global` values remain constant throughout the user's session.
</DESCRIPTION>

<SCHEMA>
```yaml
_global:
  type: string | boolean | object
  description: Access values from the global configuration object.
  oneOf:
    - type: string
      description: The key to retrieve from global. Dot notation supported.
    - type: boolean
      description: If true, returns the entire global object.
    - type: object
      properties:
        key:
          type: string
          description: The key to retrieve. Dot notation and block list indexes supported.
        all:
          type: boolean
          description: If true, returns the entire global object.
        default:
          type: any
          description: Value to return if the key is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Accessing theme colors

Use global color definitions for consistent styling across the app.

```yaml
# In lowdefy.yaml:
global:
  colors:
    primary: '#001528'
    success: '#52c41a'
    warning: '#fa8c16'
    error: '#cf1322'

# In a page:
id: status_indicator
type: Tag
properties:
  title:
    _state: record.status
  color:
    _switch:
      branches:
        - if:
            _eq:
              - _state: record.status
              - Active
          then:
            _global: colors.success
        - if:
            _eq:
              - _state: record.status
              - Pending
          then:
            _global: colors.warning
        - if:
            _eq:
              - _state: record.status
              - Inactive
          then:
            _global: colors.error
      default:
        _global: colors.primary
```

---

###### Example 2: Using shared enum options

Reference common dropdown options defined globally.

```yaml
# In lowdefy.yaml:
global:
  enums:
    priority_levels:
      - label: Low
        value: low
        color: '#52c41a'
      - label: Medium
        value: medium
        color: '#fa8c16'
      - label: High
        value: high
        color: '#cf1322'
      - label: Critical
        value: critical
        color: '#722ed1'

# In a page:
id: priority_selector
type: ButtonSelector
properties:
  title: Priority
  options:
    _global: enums.priority_levels
```

---

###### Example 3: Feature flag configuration

Control feature visibility with global configuration.

```yaml
# In lowdefy.yaml:
global:
  features:
    enable_analytics: true
    enable_export: true
    enable_advanced_filters: false
    beta_features: false

# In a page:
id: export_button
type: Button
visible:
  _global: features.enable_export
properties:
  title: Export Data
  icon: AiOutlineExport

id: beta_panel
type: Card
visible:
  _global: features.beta_features
properties:
  title: Beta Features
  extra: Experimental
```

---

###### Example 4: Accessing nested configuration with defaults

Retrieve deeply nested values with fallback defaults.

```yaml
# In lowdefy.yaml:
global:
  app_config:
    name: My Application
    settings:
      pagination:
        default_page_size: 25
        max_page_size: 100
      uploads:
        max_file_size_mb: 10
        allowed_types:
          - pdf
          - doc
          - docx

# In a page:
id: file_upload
type: S3UploadButton
properties:
  title: Upload Document
  maxSize:
    _product:
      - _global:
          key: app_config.settings.uploads.max_file_size_mb
          default: 5
      - 1048576  # Convert MB to bytes
  accept:
    _string.concat:
      - '.'
      - _array.join:
          - _global: app_config.settings.uploads.allowed_types
          - ',.'

id: records_table
type: AgGridAlpine
properties:
  pagination: true
  paginationPageSize:
    _global:
      key: app_config.settings.pagination.default_page_size
      default: 20
```

---

###### Example 5: Complex global configuration with multiple use cases

Combine multiple global values for comprehensive application configuration.

```yaml
# In lowdefy.yaml:
global:
  app_config:
    name: Inventory Management System
    version: 2.1.0
  colors:
    primary: '#001528'
    secondary: '#A4B6CC'
    success: '#52c41a'
    error: '#cf1322'
  enums:
    product_categories:
      - label: Electronics
        value: electronics
        icon: AiOutlineLaptop
      - label: Clothing
        value: clothing
        icon: AiOutlineSkin
      - label: Food & Beverage
        value: food
        icon: AiOutlineCoffee
    stock_statuses:
      - label: In Stock
        value: in_stock
        color: '#52c41a'
      - label: Low Stock
        value: low_stock
        color: '#fa8c16'
      - label: Out of Stock
        value: out_stock
        color: '#cf1322'

# In a page:
id: product_form
type: Card
properties:
  title:
    _string.concat:
      - _global: app_config.name
      - ' - New Product'
blocks:
  - id: category_select
    type: Selector
    properties:
      title: Category
      options:
        _global: enums.product_categories

  - id: stock_status
    type: ButtonSelector
    properties:
      title: Stock Status
      options:
        _array.map:
          - _global: enums.stock_statuses
          - _function:
              label: __args.0.label
              value: __args.0.value
              style:
                backgroundColor: __args.0.color

  - id: app_version
    type: Paragraph
    style:
      color:
        _global: colors.secondary
      fontSize: 12
    properties:
      content:
        _string.concat:
          - 'Version: '
          - _global: app_config.version
```

</EXAMPLES>
