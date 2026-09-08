# _object

The `_object` operator can be used to run javascript [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) methods.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _object.assign

```
(objs: obj[]): object
```

The `_object.assign` method copies the values of one ore more source objects to a target objects. The first object in the arguments array is the target object, and the rest are source objects. Keys in the target object are overwritten. The result of `_object.assign` can be seen as a "shallow-merge" of all the objects in the array, with the values in later objects taken preferentially.

#### Arguments

###### array
An array of objects.

#### Examples

###### Merge three objects:
```yaml
_object.assign:
  - firstName: Rachel
    lastName: Green
    series: Friends
  - firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
  - friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```
Returns:
```yaml
firstName: Monica
lastName: Geller
series: Friends
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

## _object.defineProperty

```
(arguments: {
  on: object,
  key: string,
  descriptor: {
    value: any,
    configurable?: boolean,
    enumerable?: boolean,
    writable?: boolean
  }
}): any
(arguments: [
  on: object,
  key: string,
  descriptor: {
    value: any,
    configurable?: boolean,
    enumerable?: boolean,
    writable?: boolean
  }
]): any
```

The `_object.defineProperty` method defines a new property directly on an object, or modifies an existing property on an object, and returns the object. The first object in the arguments array, or the `on` parameter, is the target object to which the property will be applied. The second argument, or the `key` parameter, is the property name or key which will be applied to the target object. The third and last object argument, or the `descriptor` parameter, has serval options to consider, however, for the most common application set the `value` object key to the value that should be applied to the target object key. See [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) for a more detailed description.

> The `_object.defineProperty` method is handy when the `key` to set is variable.

#### Examples

###### Set a value to a object key:
```yaml
_object.defineProperty:
  on:
    firstName: Rachel
    series: Friends
  key: lastName
  descriptor:
    value: Green
```
Returns:
```yaml
firstName: Rachel
lastName: Green
series: Friends
```

## _object.entries

```
(obj: object): any[]
```

The `_object.entries` method returns an array with an array of key-values pairs of all the fields in an object.

#### Arguments

###### object
The object to get entries from.

#### Examples

###### Get the entries of an object:
```yaml
_object.entries:
  firstName: Monica
  lastName: Geller
```
Returns:
```yaml
- - firstName
  - Monica
- - lastName
  - Geller
```

## _object.fromEntries

```
(array: any[][]): object
```

The `_object.fromEntries` method creates an object from an array of key-value pairs.

#### Arguments

###### array
The array of key-value pairs.

#### Examples

###### Get the entries of an object:
```yaml
_object.fromEntries:
  - - firstName
    - Monica
  - - lastName
    - Geller
```
Returns:
```yaml
firstName: Monica
lastName: Geller
```

## _object.keys

```
(obj: object): string[]
```

The `_object.keys` method returns an array with the objects keys.

#### Arguments

###### object
The object to get keys from.

#### Examples

###### Get the keys of an object:
```yaml
_object.keys:
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
Returns:
```yaml
- firstName
- lastName
- address
- friends
```

## _object.values

```
(obj: object): any[]
```

The `_object.values` method returns an array with the values of all the fields in an object.

#### Arguments

###### object
The object to get values from.

#### Examples

###### Get the values of an object:
```yaml
_object.values:
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
Returns:
```yaml
- Monica
- Geller
- street: 90 Bedford St
  city: New York
  zipCode: '10014'
  country: US
- - Ross Geller
  - Rachel Green
  - Chandler Bing
  - Phoebe Buffay
  - Joey Tribbiani
```
