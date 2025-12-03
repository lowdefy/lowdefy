<TITLE>
_user
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_user` operator retrieves values from the current authenticated user object. This provides access to user properties such as ID, email, name, roles, and custom attributes set during authentication.

The user object structure depends on your authentication configuration, but commonly includes:
- `id`: User's unique identifier
- `email`: User's email address
- `name`: User's display name
- `roles`: Array of user roles
- `profile`: User profile information
- Custom fields defined in your auth configuration
<DESCRIPTION>

<USAGE>
```
(key: string | object): any

###### key (string)

A dot-notation path string to get a value from the user object.

###### key (object)

An object with the following properties:
- `key`: The dot-notation path string
- `default`: A default value to return if the key is not found
- `all`: If true, returns the entire user object (ignores key)
```
<USAGE>

<SCHEMA>
```yaml
# String shorthand - get value by key
_user: keyPath

# Object syntax with default
_user:
  key: keyPath
  default: defaultValue

# Get entire user object
_user:
  all: true
```
<SCHEMA>

<EXAMPLES>
### Get user ID:
```yaml
_user: id
```

Returns: User's unique identifier

### Get user email:
```yaml
_user: email
```

Returns: User's email address

### Get user name with default:
```yaml
_user:
  key: name
  default: Guest
```

Returns: User's name or 'Guest' if not authenticated

### Get user roles:
```yaml
_user: roles
```

Returns: Array of user roles like `['admin', 'editor']`

### Check user role:
```yaml
_array.includes:
  on:
    _user: roles
  value: admin
```

Returns: `true` if user has admin role

### Get nested profile data:
```yaml
_user: profile.avatar_url
```

Returns: User's profile avatar URL

### Conditional based on auth status:
```yaml
id: login_button
type: Button
visible:
  _not:
    _user: id
properties:
  title: Sign In
```

Button visible only when not logged in

### Display personalized content:
```yaml
id: welcome
type: Title
visible:
  _user: id
properties:
  content:
    _string.concat:
      - 'Welcome, '
      - _user: name
      - '!'
```

Shows personalized greeting for logged-in users

### Access custom user attributes:
```yaml
_user: app_attributes.department
```

Returns: User's department from custom attributes

### Get entire user object:
```yaml
_user:
  all: true
```

Returns: Complete user object for debugging or complex operations

### Role-based access control:
```yaml
id: admin_section
type: Box
visible:
  _or:
    - _array.includes:
        on:
          _user: roles
        value: admin
    - _array.includes:
        on:
          _user: roles
        value: superuser
```

Section visible to admins and superusers

### Use in request parameters:
```yaml
id: fetch_user_data
type: Request
params:
  user_id:
    _user: id
  organization_id:
    _user: global_attributes.organization_id
```

Passes user info to API request
<EXAMPLES>
