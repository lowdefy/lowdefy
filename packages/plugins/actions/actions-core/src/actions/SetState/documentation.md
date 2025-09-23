<TITLE>
SetState
<TITLE>

<DESCRIPTION>
The `SetState` action sets values in `state`. It takes an object as parameters, and sets each of those values to the `state` object.
This is useful if you want to initialize `state`, set a flag after an action has executed (eg. to disable a button), or to set the result
of a request to state.
<DESCRIPTION>

<USAGE>
```
(toSet: object): void
```

###### object
Object with key value pairs to set in `state`.
</USAGE>

<EXAMPLES>
### Set a single value to state:
```yaml
- id: single_value
  type: SetState
  params:
    message: Hello
```

### Set multiple values to state:
```yaml
- id: multiple_values
  type: SetState
  params:
    firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
    friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```

### Using dot notation:
```yaml
- id: dot_notation
  type: SetState
  params:
    firstName: Monica
    lastName: Geller
    address.street: 90 Bedford St
    address.city: New York
    address.zipCode: '10014'
    address.country: US
    friends.0: Ross Geller
    friends.1: Rachel Green
    friends.2: Chandler Bing
    friends.3: Phoebe Buffay
    friends.5: Joey Tribbiani
```

### Initialize state with the value of a request:
```yaml
- id: initialize
  type: SetState
  params:
    _request: getUser
```
</EXAMPLES>
