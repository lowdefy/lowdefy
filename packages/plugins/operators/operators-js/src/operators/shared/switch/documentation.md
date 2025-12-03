<TITLE>
_switch
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_switch` operator evaluates multiple conditions in sequence and returns the value from the first matching branch. If no conditions match, it returns the default value.

Each branch has an `if` condition (must be boolean) and a `then` value. Branches are evaluated in order, and the first branch with `if: true` returns its `then` value.
<DESCRIPTION>

<USAGE>
```
(params: object): any

###### params

An object with the following properties:
- `branches`: Array of { if: boolean, then: any } objects
- `default`: Value to return if no branch matches
```
<USAGE>

<SCHEMA>
```yaml
_switch:
  branches:
    - if: boolean
      then: any
    - if: boolean
      then: any
  default: any
```
<SCHEMA>

<EXAMPLES>
### Simple status mapping:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - _state: status
          - draft
      then: gray
    - if:
        _eq:
          - _state: status
          - pending
      then: orange
    - if:
        _eq:
          - _state: status
          - approved
      then: green
  default: blue
```

Returns: Color based on status

### Grade calculation:
```yaml
_switch:
  branches:
    - if:
        _gte:
          - _state: score
          - 90
      then: A
    - if:
        _gte:
          - _state: score
          - 80
      then: B
    - if:
        _gte:
          - _state: score
          - 70
      then: C
    - if:
        _gte:
          - _state: score
          - 60
      then: D
  default: F
```

Returns: Letter grade based on score

### Dynamic label:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - _array.length:
              _state: items
          - 0
      then: No items
    - if:
        _eq:
          - _array.length:
              _state: items
          - 1
      then: 1 item
  default:
    _string.concat:
      - _array.length:
          _state: items
      - ' items'
```

Returns: Appropriate item count label

### Priority icon:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - _state: task.priority
          - critical
      then: AiFillFire
    - if:
        _eq:
          - _state: task.priority
          - high
      then: AiOutlineExclamation
    - if:
        _eq:
          - _state: task.priority
          - medium
      then: AiOutlineMinus
  default: AiOutlineArrowDown
```

Returns: Icon name based on priority

### Complex conditional display:
```yaml
_switch:
  branches:
    - if:
        _and:
          - _eq:
              - _state: user.type
              - admin
          - _state: user.verified
      then: Full Admin Access
    - if:
        _eq:
          - _state: user.type
          - admin
      then: Admin (Unverified)
    - if:
        _state: user.verified
      then: Verified User
  default: Guest
```

Returns: User access level description

### Date-based message:
```yaml
_switch:
  branches:
    - if:
        _lt:
          - _date.getHours:
              _date.now:
          - 12
      then: Good morning
    - if:
        _lt:
          - _date.getHours:
              _date.now:
          - 18
      then: Good afternoon
  default: Good evening
```

Returns: Time-appropriate greeting
<EXAMPLES>
