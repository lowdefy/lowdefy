# _uuid

```
(void): string
```

The `_uuid` operator creates [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier). A UUID is a random identifier that is, for all practical purposes, unique. It looks like:

```
123e4567-e89b-12d3-a456-426614174000
```

#### Arguments

###### default:
`_uuid: true`, `_uuid: null` or `_uuid: undefined` returns a version 4 UUID.

#### Examples

###### Generate a v4 uuid:
```yaml
_uuid: null
```
Returns: A version 4 UUID.

# Operator methods:

## _uuid.v1

```
(void): string
```

Create a version 1 (timestamp) UUID.

#### Arguments

The `_uuid.v1` method does not take any arguments.

#### Examples

###### Generate a version 1 UUID:
```yaml
_uuid.v1: null
```
Returns: A version 1 UUID.

## _uuid.v3

```
({name: string | string[], namespace: string | string[]}): string
([name: string | string[], namespace: string | string[]]): string
```

Create a version 3 (namespace w/ MD5) UUID.

#### Arguments

###### object:
If the `_uuid` operator is called with arguments, it can be one of the following:
  - `name: string | string[]`: A string or an array.
  - `namespace: string | string[]`: A string or an Array[16] - Namespace UUID.

#### Examples

###### Generate a version 3 UUID:
```yaml
_uuid.v3:
  name: hello
  namespace: world
```
Returns: A version 3 UUID.

## _uuid.v4

```
(void): string
```

Create a version 4 (random) UUID.

#### Arguments

The `_uuid.v4` method does not take any arguments.

#### Examples

###### Generate a version 4 UUID:
```yaml
_uuid.v4: null
```
Returns: A version 4 UUID.

## _uuid.v5

```
({name: string | string[], namespace: string | string[]}): string
([name: string | string[], namespace: string | string[]]): string
```

Create a version 5 (namespace w/ SHA-1) UUID.

#### Arguments

###### object:
If the `_uuid` operator is called with arguments, it can be one of the following:
  - `name: string | string[]`: A string or an array.
  - `namespace: string | string[]`: A string or an Array[16] - Namespace UUID.

#### Examples

###### Generate a version 5 UUID:
```yaml
_uuid.v5:
  name: hello
  namespace: world
```
Returns: A version 5 UUID.
