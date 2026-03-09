# @lowdefy/nunjucks

Nunjucks template engine wrapper with Lowdefy-specific filters.

## Overview

Provides template rendering with:

- Memoized template compilation
- Custom date formatting filter
- Array and URL utilities
- Syntax validation

## Installation

```javascript
import { nunjucksString, nunjucksFunction } from '@lowdefy/nunjucks';
```

## Functions

### nunjucksString(templateString, value)

Render template from string (one-off, slower):

```javascript
const result = nunjucksString('Hello {{ name }}!', { name: 'World' });
// 'Hello World!'
```

### nunjucksFunction(templateString)

Compile and memoize template function (faster for repeated use):

```javascript
const template = nunjucksFunction('Hello {{ name }}!');

template({ name: 'Alice' }); // 'Hello Alice!'
template({ name: 'Bob' }); // 'Hello Bob!'
```

**Performance Note:** Templates are cached by string content, so the same template string will reuse the compiled function.

### validNunjucksString(templateString, returnError)

Validate template syntax:

```javascript
// Returns boolean
validNunjucksString('{{ name }}'); // true
validNunjucksString('{{ name'); // false

// Return error object
const result = validNunjucksString('{{ name', true);
// { valid: false, error: SyntaxError }
```

### nunjucksEnv

Access the configured Nunjucks environment:

```javascript
import { nunjucksEnv } from '@lowdefy/nunjucks';

// Add custom filter
nunjucksEnv.addFilter('uppercase', (str) => str.toUpperCase());
```

## Custom Filters

### date(value, format, ...args)

Format dates using moment.js:

```javascript
// Default ISO format
{
  {
    date | date;
  }
}
// '2024-01-15T10:30:00.000Z'

// Custom format
{
  {
    date | date('YYYY-MM-DD');
  }
}
// '2024-01-15'

// Relative time
{
  {
    date | date('fromNow');
  }
}
// '2 hours ago'

// With method chaining
{
  {
    date | date('add', 1, 'days') | date('YYYY-MM-DD');
  }
}
// '2024-01-16'
```

**Supported Moment Methods:**

- `format(string)` - Format date
- `fromNow()` - Relative time
- `add(n, unit)` - Add time
- `subtract(n, unit)` - Subtract time
- `startOf(unit)` - Start of period
- `endOf(unit)` - End of period

### unique(array)

Get unique values from array:

```javascript
{
  {
    [1, 2, 2, 3, 3, 3] | unique;
  }
}
// [1, 2, 3]

{
  {
    items | unique;
  }
}
```

### urlQuery(value)

Parse or format URL query strings:

```javascript
// Parse string to object
{{ 'page=1&filter=active' | urlQuery }}
// { page: '1', filter: 'active' }

// Format object to string
{{ { page: 1, filter: 'active' } | urlQuery }}
// 'page=1&filter=active'
```

## Template Syntax

Standard Nunjucks syntax:

```nunjucks
{# Comments #}

{{ variable }}
{{ object.property }}
{{ array[0] }}

{% if condition %}
  content
{% elif otherCondition %}
  other content
{% else %}
  fallback
{% endif %}

{% for item in items %}
  {{ item.name }}
{% endfor %}

{{ value | filter }}
{{ value | filter(arg1, arg2) }}
```

## Dependencies

- `nunjucks` (3.2.4)
- `moment` (2.29.4)
- `@lowdefy/helpers` (4.4.0)

## Usage Examples

### Dynamic Labels

```javascript
import { nunjucksString } from '@lowdefy/nunjucks';

const label = nunjucksString('Showing {{ count }} of {{ total }} items', { count: 10, total: 100 });
// 'Showing 10 of 100 items'
```

### Date Formatting

```javascript
import { nunjucksString } from '@lowdefy/nunjucks';

const formatted = nunjucksString('Created: {{ date | date("MMMM D, YYYY") }}', {
  date: new Date('2024-01-15'),
});
// 'Created: January 15, 2024'
```

### Conditional Content

```javascript
import { nunjucksString } from '@lowdefy/nunjucks';

const message = nunjucksString(
  `
  {% if items.length > 0 %}
    {{ items.length }} items found
  {% else %}
    No items found
  {% endif %}
`,
  { items: ['a', 'b', 'c'] }
);
// '3 items found'
```

### Reusable Templates

```javascript
import { nunjucksFunction } from '@lowdefy/nunjucks';

const emailTemplate = nunjucksFunction(`
Dear {{ name }},

Thank you for your order #{{ orderId }}.
Total: ${{ total | round(2) }}

{% for item in items %}
- {{ item.name }}: ${{ item.price }}
{% endfor %}
`);

const email1 = emailTemplate({
  name: 'Alice',
  orderId: '12345',
  total: 99.99,
  items: [{ name: 'Widget', price: 49.99 }]
});
```

### Validation

```javascript
import { validNunjucksString } from '@lowdefy/nunjucks';

function validateTemplate(template) {
  const result = validNunjucksString(template, true);

  if (!result.valid) {
    throw new Error(`Invalid template: ${result.error.message}`);
  }

  return true;
}
```

## Build Configuration

Uses webpack with SWC loader for bundling. Output is CommonJS module.

## Key Files

| File                            | Purpose                    |
| ------------------------------- | -------------------------- |
| `src/nunjucksString.js`         | One-off rendering          |
| `src/nunjucksFunction.js`       | Compiled template function |
| `src/validNunjucksString.js`    | Syntax validation          |
| `src/nunjucksEnv.js`            | Environment configuration  |
| `src/filters/dateFilter.js`     | Date formatting filter     |
| `src/filters/uniqueFilter.js`   | Array unique filter        |
| `src/filters/urlQueryFilter.js` | URL query filter           |
