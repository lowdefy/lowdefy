# @lowdefy/operators-js

Core JavaScript operators for Lowdefy. The primary operator package included by default.

## Overview

This package provides:
- Data access operators (`_state`, `_request`, `_user`)
- Logic operators (`_if`, `_and`, `_or`)
- Math operators (`_sum`, `_multiply`, `_math`)
- String operators (`_string`, `_regex`)
- Array/Object operators (`_array`, `_object`, `_get`)
- Type utilities (`_type`, `_number`, `_json`)

## Data Access Operators

### _state

Access page state:

```yaml
# Get value
name:
  _state: userName

# With default
name:
  _state:
    key: userName
    default: Anonymous
```

### _request

Access request responses:

```yaml
users:
  _request: getUsers           # Entire response

userName:
  _request: getUsers.data.name  # Nested path
```

### _url_query

Access URL query parameters:

```yaml
# URL: /page?tab=settings
currentTab:
  _url_query: tab
```

### _input

Access navigation input:

```yaml
# Passed via Link action
itemId:
  _input: id
```

### _global

Access global state:

```yaml
theme:
  _global: userTheme
```

### _user

Access user session (requires auth):

```yaml
userId:
  _user: id

userName:
  _user: name

userRoles:
  _user: roles
```

### _secret

Access secrets (server-side only):

```yaml
# In connection config
apiKey:
  _secret: EXTERNAL_API_KEY
```

### _args

Access function arguments:

```yaml
# In custom functions
value:
  _args: 0    # First argument
```

### _event

Access event payload:

```yaml
events:
  onClick:
    - id: log
      type: SetState
      params:
        clickedItem:
          _event: value
```

## Logic Operators

### _if

Conditional logic:

```yaml
message:
  _if:
    test:
      _state: isAdmin
    then: Admin Panel
    else: User Dashboard
```

### _and / _or / _not

Boolean logic:

```yaml
visible:
  _and:
    - _state: isLoggedIn
    - _state: hasPermission

# OR
showButton:
  _or:
    - _state: isAdmin
    - _state: isOwner

# NOT
disabled:
  _not:
    _state: isEnabled
```

### Comparison Operators

```yaml
# Equality
_eq: [a, b]      # a == b
_ne: [a, b]      # a != b

# Numeric
_gt: [a, b]      # a > b
_gte: [a, b]     # a >= b
_lt: [a, b]      # a < b
_lte: [a, b]     # a <= b
```

### _switch

Multiple conditions:

```yaml
color:
  _switch:
    branches:
      - if:
          _eq:
            - _state: status
            - error
        then: red
      - if:
          _eq:
            - _state: status
            - warning
        then: orange
    default: green
```

### _if_none

Default for null/undefined:

```yaml
name:
  _if_none:
    - _state: userName
    - Anonymous
```

## Math Operators

### Basic Math

```yaml
total:
  _sum:
    - _state: price
    - _state: tax

difference:
  _subtract:
    - _state: total
    - _state: discount

product:
  _multiply:
    - _state: quantity
    - _state: price

average:
  _divide:
    - _state: total
    - _state: count
```

### _math

Advanced math operations:

```yaml
rounded:
  _math:
    method: round
    args:
      - _state: value

absolute:
  _math:
    method: abs
    args:
      - _state: number
```

Supported methods: `abs`, `ceil`, `floor`, `round`, `max`, `min`, `pow`, `sqrt`, etc.

### _random

Random number:

```yaml
randomId:
  _random: {}              # 0-1

diceRoll:
  _random:
    min: 1
    max: 6
    integer: true
```

## String Operators

### _string

Concatenate strings:

```yaml
fullName:
  _string:
    - _state: firstName
    - ' '
    - _state: lastName
```

### _regex

Regular expression:

```yaml
isEmail:
  _regex:
    pattern: '^[\\w-]+@[\\w-]+\\.[a-z]{2,}$'
    value:
      _state: email
    flags: i
```

## Array/Object Operators

### _array

Create array:

```yaml
items:
  _array:
    - item1
    - _state: dynamicItem
    - item3
```

### _object

Create object:

```yaml
user:
  _object:
    - - name
      - _state: userName
    - - email
      - _state: userEmail
```

### _get

Get nested value:

```yaml
city:
  _get:
    from:
      _request: getUser
    key: address.city
    default: Unknown
```

## Type Operators

### _type

Check type:

```yaml
isArray:
  _type:
    type: array
    value:
      _state: items
```

### _number

Parse number:

```yaml
count:
  _number:
    _state: countString
```

### _json

JSON parse/stringify:

```yaml
# Parse
data:
  _json:
    parse:
      _state: jsonString

# Stringify
jsonStr:
  _json:
    stringify:
      _state: data
```

## Utility Operators

### _log

Debug logging (outputs to console):

```yaml
debug:
  _log:
    _state: debugValue
```

### _intl

Internationalization:

```yaml
price:
  _intl:
    type: NumberFormat
    locale: en-US
    options:
      style: currency
      currency: USD
    value:
      _state: price
```

### _uri

URI encoding:

```yaml
encoded:
  _uri:
    encode:
      _state: searchQuery
```

### _date

Current date/time:

```yaml
now:
  _date: now

timestamp:
  _date:
    - now
    - format: YYYY-MM-DD
```
