# Operators Plugin Overview

Operators are functions that make Lowdefy configuration dynamic. They transform static YAML into reactive applications.

## What Are Operators?

Operators are:

- Functions prefixed with `_`
- Evaluated at build time or runtime
- Used to access state, transform data, add logic
- The "code" in configuration-driven apps

## Operator Evaluation Contexts

| Context    | When              | Package         | Example Operators      |
| ---------- | ----------------- | --------------- | ---------------------- |
| **Build**  | `lowdefy build`   | @lowdefy/build  | `_ref`, `_var`, `_env` |
| **Server** | Request execution | @lowdefy/api    | `_secret`, `_user`     |
| **Client** | Page rendering    | @lowdefy/engine | `_state`, `_request`   |

## Available Operator Packages

| Package                                            | Purpose                  | Key Operators                     |
| -------------------------------------------------- | ------------------------ | --------------------------------- |
| [@lowdefy/operators-js](./js.md)                   | Core JS operators        | `_if`, `_get`, `_state`, `_array` |
| [@lowdefy/operators-mql](./mql.md)                 | MongoDB Query Language   | `_mql_*` query operators          |
| [@lowdefy/operators-moment](./moment.md)           | Date/time with Moment.js | `_moment`, `_date`                |
| [@lowdefy/operators-nunjucks](./nunjucks.md)       | Template strings         | `_nunjucks`                       |
| [@lowdefy/operators-change-case](./change-case.md) | String case conversion   | `_change_case`                    |
| [@lowdefy/operators-diff](./diff.md)               | Object diffing           | `_diff`                           |
| [@lowdefy/operators-uuid](./uuid.md)               | UUID generation          | `_uuid`                           |
| [@lowdefy/operators-yaml](./yaml.md)               | YAML parsing             | `_yaml_parse`, `_yaml_stringify`  |
| [@lowdefy/operators-jsonata](./jsonata.md)         | JSONata queries          | `_jsonata`                        |

## Operator Syntax

### Standard Form

```yaml
result:
  _operatorName:
    param1: value1
    param2: value2
```

### Shorthand (for getters)

```yaml
# Shorthand
value:
  _state: fieldName

# Equivalent to:
value:
  _state:
    key: fieldName
```

### Nested Operators

Operators can contain other operators:

```yaml
greeting:
  _if:
    test:
      _eq:
        - _state: userType
        - admin
    then:
      _string:
        - 'Welcome, Admin '
        - _state: userName
    else: Welcome, User
```

## Core Data Access Operators

These are from `@lowdefy/operators-js`:

| Operator     | Purpose             | Context       |
| ------------ | ------------------- | ------------- |
| `_state`     | Page state values   | Client        |
| `_request`   | Request responses   | Client        |
| `_url_query` | URL parameters      | Client        |
| `_input`     | Navigation input    | Client        |
| `_global`    | Global state        | Client        |
| `_user`      | User session        | Server/Client |
| `_secret`    | Environment secrets | Server        |
| `_args`      | Function arguments  | All           |
| `_event`     | Event payload       | Client        |

## Logic Operators

| Operator | Purpose          |
| -------- | ---------------- |
| `_if`    | Conditional      |
| `_and`   | Logical AND      |
| `_or`    | Logical OR       |
| `_not`   | Logical NOT      |
| `_eq`    | Equality         |
| `_ne`    | Not equal        |
| `_gt`    | Greater than     |
| `_gte`   | Greater or equal |
| `_lt`    | Less than        |
| `_lte`   | Less or equal    |

## Data Transform Operators

| Operator    | Purpose             |
| ----------- | ------------------- |
| `_get`      | Get nested value    |
| `_array`    | Create array        |
| `_object`   | Create object       |
| `_string`   | Concatenate strings |
| `_sum`      | Sum numbers         |
| `_subtract` | Subtract            |
| `_multiply` | Multiply            |
| `_divide`   | Divide              |
| `_math`     | Math operations     |

## Design Decisions

### Why Underscore Prefix?

- Clear visual distinction from data
- Won't conflict with user property names
- Easy to identify during parsing
- Common convention (MongoDB uses $)

### Why Multiple Packages?

- Modularity: only include what you use
- Bundle size: Moment.js is heavy
- Flexibility: swap implementations
- Independence: version separately

### Why Not Just JavaScript?

Operators provide:

- Declarative configuration
- Safe evaluation (sandboxed)
- Build-time analysis
- Consistent cross-context behavior
- Easier debugging
