# _user

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_user` operator gets a value from the [`user`](/user-object) object. The `user` object contains the data in the user idToken if OpenID Connect authentication is configured and a user is logged in.

#### Arguments

###### string
If the `_user` operator is called with a string argument, the value of the key in the `user` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably.

###### boolean
If the `_user` operator is called with boolean argument `true`, the entire `user` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `user` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `user` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `user`. By default, `null` is returned if a value is not found.

#### Examples

###### Get the value of `name` from `user`:
```yaml
_user: name
```
```yaml
_user:
  key: name
```
Returns: The value of `name` in `user`.

###### Get the entire `user` object:
```yaml
_user: true
```
```yaml
_user:
  all: true
```
Returns: The entire `user` object.

###### Dot notation:
Assuming user:
```yaml
sub: abc123
name: User Name
my_object:
  subfield: 'Value'
```
then:
```yaml
_user: my_object.subfield
```
```yaml
_user:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_user:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `user`:
```yaml
sub: abc123
name: User Name
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_user: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.

# Operator methods:

## _user.hasRole

```
(role: string): boolean
```

The `_user.hasRole` method returns `true` if the `user.roles` array contains the given role. It returns `false` when the user is not logged in, when `user.roles` is missing, or when the role is not present.

The `user.roles` value is read directly from the `user` object and must be an array of strings. An error is thrown if `user.roles` is defined but is not an array, or if the argument is not a string.

#### Examples

###### Check for a single role:
```yaml
_user.hasRole: admin
```
Returns: `true` if `user.roles` includes `"admin"`.

## _user.hasSomeRoles

```
(roles: string[]): boolean
```

The `_user.hasSomeRoles` method returns `true` if the `user.roles` array contains at least one of the given roles. It returns `false` when the user is not logged in, when `user.roles` is missing, or when none of the roles match.

The `user.roles` value is read directly from the `user` object and must be an array of strings. An error is thrown if `user.roles` is defined but is not an array, or if the argument is not an array of strings.

For checking a single role, use [`_user.hasRole`](#hasRole).

#### Examples

###### Check for any of several roles:
```yaml
_user.hasSomeRoles:
  - admin
  - support
```
Returns: `true` if `user.roles` includes `"admin"` or `"support"`.

## _user.hasAllRoles

```
(roles: string[]): boolean
```

The `_user.hasAllRoles` method returns `true` if the `user.roles` array contains every one of the given roles. It returns `false` when the user is not logged in, when `user.roles` is missing, or when any required role is not present.

The `user.roles` value is read directly from the `user` object and must be an array of strings. An error is thrown if `user.roles` is defined but is not an array, or if the argument is not an array of strings.

For checking a single role, use [`_user.hasRole`](#hasRole).

#### Examples

###### Require all of several roles:
```yaml
_user.hasAllRoles:
  - admin
  - support
```
Returns: `true` only if `user.roles` includes both `"admin"` and `"support"`.
