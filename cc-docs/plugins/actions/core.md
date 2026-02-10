# @lowdefy/actions-core

Core actions for Lowdefy. The primary action package included by default.

## Actions

| Action | Purpose |
|--------|---------|
| `SetState` | Modify page state |
| `SetGlobal` | Modify global state |
| `Request` | Execute data request |
| `CallAPI` | Call custom endpoint |
| `Link` | Navigate to page |
| `Login` | Trigger login |
| `Logout` | Trigger logout |
| `DisplayMessage` | Show notification |
| `Validate` | Validate form |
| `Reset` | Reset state |
| `ResetValidation` | Clear validation errors |
| `CallMethod` | Call block method |
| `CopyToClipboard` | Copy text to clipboard |
| `ScrollTo` | Scroll to element |
| `SetFocus` | Focus element |
| `Wait` | Delay execution |
| `Fetch` | Client-side fetch |
| `Throw` | Throw error |
| `UpdateSession` | Refresh auth session |
| `GeolocationCurrentPosition` | Get GPS location |

## SetState

Modify page state:

```yaml
- id: update
  type: SetState
  params:
    name: John               # Simple value
    count:                   # Dynamic value
      _sum:
        - _state: count
        - 1
    user.name:               # Nested path
      _event: value
```

### SetState Operations

```yaml
# Set value
params:
  field: value

# Set from event
params:
  inputValue:
    _event: value

# Merge object
params:
  _object.assign:
    - _state: formData
    - newField: value
```

## SetGlobal

Modify global (cross-page) state:

```yaml
- id: setTheme
  type: SetGlobal
  params:
    theme: dark
```

## Request

Execute a data request:

```yaml
- id: getData
  type: Request
  params:
    requestId: fetchUsers
    # Optional: override request params
    payload:
      filter:
        _state: searchQuery
```

### Request with Loading State

```yaml
events:
  onClick:
    - id: setLoading
      type: SetState
      params:
        loading: true
    - id: fetch
      type: Request
      params:
        requestId: getData
    - id: clearLoading
      type: SetState
      params:
        loading: false
```

## CallAPI

Call custom API endpoint:

```yaml
- id: processData
  type: CallAPI
  params:
    endpointId: processOrder
    payload:
      orderId:
        _state: orderId
```

## Link

Navigate to another page:

```yaml
- id: goToDetails
  type: Link
  params:
    pageId: user-details
    input:
      userId:
        _state: selectedUserId

# External URL
- id: goExternal
  type: Link
  params:
    url: https://example.com
    newTab: true
```

### Link Parameters

| Param | Purpose |
|-------|---------|
| `pageId` | Target page ID |
| `url` | External URL |
| `input` | Data to pass |
| `urlQuery` | Query parameters |
| `newTab` | Open in new tab |
| `home` | Go to home page |
| `back` | Go back |

## Login / Logout

```yaml
# Trigger login
- id: login
  type: Login

# Trigger logout
- id: logout
  type: Logout
  params:
    redirect: /goodbye
```

## DisplayMessage

Show toast notification:

```yaml
- id: notify
  type: DisplayMessage
  params:
    content: Operation successful!
    type: success        # success, error, warning, info
    duration: 3          # seconds
```

## Validate

Validate form inputs:

```yaml
- id: validateForm
  type: Validate
  params:
    blockIds:            # Optional: specific blocks
      - email
      - password
```

If validation fails, subsequent actions are skipped.

## Reset

Reset state to initial values:

```yaml
- id: clearForm
  type: Reset
```

## ResetValidation

Clear validation errors:

```yaml
- id: clearErrors
  type: ResetValidation
```

## CallMethod

Call a block's method:

```yaml
- id: submitForm
  type: CallMethod
  params:
    blockId: myForm
    method: submit
    args:
      - option1
```

## CopyToClipboard

Copy text to clipboard:

```yaml
- id: copy
  type: CopyToClipboard
  params:
    text:
      _state: shareLink
    message: Link copied!
```

## ScrollTo

Scroll to element or position:

```yaml
- id: scrollToTop
  type: ScrollTo
  params:
    top: 0

- id: scrollToElement
  type: ScrollTo
  params:
    blockId: results
```

## SetFocus

Focus an input:

```yaml
- id: focusInput
  type: SetFocus
  params:
    blockId: emailInput
```

## Wait

Delay before next action:

```yaml
- id: delay
  type: Wait
  params:
    ms: 1000    # milliseconds
```

## Fetch

Client-side HTTP request (no secrets):

```yaml
- id: fetchExternal
  type: Fetch
  params:
    url: https://api.example.com/data
    method: GET
```

## Throw

Throw an error (stops action chain):

```yaml
- id: checkCondition
  type: Throw
  skip:
    _state: isValid
  params:
    message: Validation failed
```

## UpdateSession

Refresh auth session:

```yaml
- id: refreshSession
  type: UpdateSession
```

## GeolocationCurrentPosition

Get user's GPS location:

```yaml
- id: getLocation
  type: GeolocationCurrentPosition
  params:
    stateKey: userLocation   # Where to store result
```
