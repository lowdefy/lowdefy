# @lowdefy/operators-nunjucks

[Nunjucks](https://mozilla.github.io/nunjucks/templating.html) template operator for Lowdefy.

## Operator

| Operator    | Purpose                  |
| ----------- | ------------------------ |
| `_nunjucks` | Render Nunjucks template |

## Usage

```yaml
message:
  _nunjucks:
    template: 'Hello, {{ name }}! You have {{ count }} messages.'
    on:
      name:
        _state: userName
      count:
        _state: messageCount
```

## Template Syntax

### Variables

```
{{ variableName }}
{{ user.name }}
{{ items[0] }}
```

### Conditionals

```
{% if isAdmin %}
  Admin Panel
{% elif isModerator %}
  Moderator Panel
{% else %}
  User Panel
{% endif %}
```

### Loops

```
{% for item in items %}
  {{ item.name }}: {{ item.value }}
{% endfor %}
```

### Filters

```
{{ name | upper }}
{{ price | round(2) }}
{{ date | date('YYYY-MM-DD') }}
{{ items | length }}
{{ text | truncate(100) }}
```

## Example: Email Template

```yaml
emailBody:
  _nunjucks:
    template: |
      Dear {{ name }},

      Your order #{{ orderId }} has been shipped.

      Items:
      {% for item in items %}
      - {{ item.name }} x {{ item.quantity }}: ${{ item.price }}
      {% endfor %}

      Total: ${{ total | round(2) }}

      Thank you for your order!
    on:
      name:
        _state: customerName
      orderId:
        _state: orderId
      items:
        _state: orderItems
      total:
        _state: orderTotal
```

## Use Cases

- Email templates
- Dynamic text generation
- Report formatting
- Complex string building
