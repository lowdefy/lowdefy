<TITLE>
SetGlobal
<TITLE>

<DESCRIPTION>
The `SetGlobal` action sets values to the `global` object. It takes an object as parameters, and sets each of those values to the `global` object.
This is useful if you need to set a value that needs to be available across multiple pages in the app, like the id of a currently selected
object. `SetGlobal` works just like `SetState`, except it sets to the `global` object and not `state`.
<DESCRIPTION>

<USAGE>
```
(toSet: object): void
```

###### object
Object with key value pairs to set in `global`.
</USAGE>

<EXAMPLES>
### Set a single value to global:
```yaml
- id: set_selected_company
  type: SetGlobal
  params:
    selected_selected_company:
      _state: company.id
```

### Set multiple values to state:
```yaml
- id: multiple_values
  type: SetGlobal
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
  type: SetGlobal
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
</EXAMPLES>
