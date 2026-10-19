# _array

The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _array.at

```
(arguments: {
  on: any[],
  index: number
}): any
(arguments: [
  on: any[],
  index: number
]): any
```

The `_array.at` method returns [the item at an index](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at). A negative index counts back from the end of the array, so `-1` returns the last item.

## _array.concat

```
(arrays: any[][]): any[]
```

The `_array.concat` method [concatenates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat) arrays.

## _array.copyWithin

```
(arguments: {
  on: any[],
  target: number,
  start?: number,
  end?: number
}): any[]
(arguments: [
  on: any[],
  target: number,
  start?: number,
  end?: number
]): any[]
```

The `_array.copyWithin` method [copies part of an array to another location in the same array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin) without modifying its length.

## _array.every

```
(arguments: {
  on: any[],
  callback: function,
}): boolean
(arguments: [
  on: any[],
  callback: function,
]): boolean
```

The `_array.every` method  tests whether [all elements in the array pass](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every) the test implemented by the provided function. It returns a Boolean value.

## _array.fill

```
(arguments: {
  on: any[],
  value: any,
  start?: number,
  end?: number
}): any[]
(arguments: [
  on: any[],
  value: number,
  start?: number,
  end?: number
]): any[]
```

The `_array.fill` method [changes all elements in an array to a static value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill), from a `start` index to an `end` index.

## _array.filter

```
(arguments: {
  on: any[],
  callback: function,
}): any[]
(arguments: [
  on: any[],
  callback: function,
]): any[]
```

The `_array.filter` method returns [an array with all elements that pass the test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) implemented by the provided function.

## _array.find

```
(arguments: {
  on: any[],
  callback: function,
}): any
(arguments: [
  on: any[],
  callback: function,
]): any
```

The `_array.find` method returns the value of the [first element in the provided array that satisfies the provided testing function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find). If no values satisfies the testing function, undefined is returned.

## _array.findIndex

```
(arguments: {
  on: any[],
  callback: function,
}): number
(arguments: [
  on: any[],
  callback: function,
]): number
```

The `_array.findIndex` method returns [the index of the first element in the array that satisfies the provided testing function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex). Otherwise, it returns -1, indicating that no element passed the test.

## _array.findLast

```
(arguments: {
  on: any[],
  callback: function,
}): any
(arguments: [
  on: any[],
  callback: function,
]): any
```

The `_array.findLast` method returns [the last element in the array that satisfies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast) the provided testing function.

## _array.findLastIndex

```
(arguments: {
  on: any[],
  callback: function,
}): number
(arguments: [
  on: any[],
  callback: function,
]): number
```

The `_array.findLastIndex` method returns [the index of the last element in the array that satisfies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex) the provided testing function, or `-1` if no element passes.

## _array.flat

```
(arguments: {on: any[], depth?: number}): any[]
(arguments: [on: any[], depth?: number]): any[]
```

The `_array.flat` method returns a array with all [sub-array elements concatenated into it recursively](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) up to the specified `depth`.

## _array.flatMap

```
(arguments: {
  on: any[],
  callback: function,
}): any[]
(arguments: [
  on: any[],
  callback: function,
]): any[]
```

The `_array.flatMap` method [maps each element with the callback and flattens the result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) by one level.

## _array.from

```
(arguments: {
  on: any[] | string | { length: number },
  callback?: function,
}): any[]
(arguments: [
  on: any[] | string | { length: number },
  callback?: function,
]): any[]
```

The `_array.from` method [creates a new array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) from an array, a string, or an object with a `length`. Use `on: { length: n }` to create an array with `n` items, and the optional `callback` (called with the item and its index) to set each item, for example `{ _function: { __args: 1 } }` creates `[0, 1, ..., n - 1]`. Combine it with `_array.fill` to create an array of `n` copies of a value.

## _array.includes

```
(arguments: {on: any[], value: any}): boolean
(arguments: [on: any[], value: any]): boolean
```

The `_array.includes` method determines whether an array [includes a certain value among its entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes), returning `true` or `false` as appropriate.

## _array.indexOf

```
(arguments: {on: any[], value: any}): number
(arguments: [on: any[], value: any]): number
```

The `_array.indexOf` method returns the [first index at which a given element can be found](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf) in the array, or `-1` if it is not present.

## _array.join

```
(arguments: {on: any[], separator?: string}): string
(arguments: [on: any[], separator?: string]): string
```

The `_array.join` method returns [a string by concatenating all of the elements in an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join), separated by commas or a specified `separator` string. If the array has only one item, then that item will be returned without using the separator.

## _array.lastIndexOf

```
(arguments: {on: any[], value: any}): number
(arguments: [on: any[], value: any]): number
```

The `_array.lastIndexOf` method returns the [last index at which a given element can be found](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf) in the array, or -1 if it is not present.

## _array.length

```
(array: any[]}): number
```

The `_array.length` method returns the [number of elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length) in the array.

## _array.map

```
(arguments: {
  on: any[],
  callback: function,
}): any[]
(arguments: [
  on: any[],
  callback: function,
]): any[]
```

The `_array.map` method returns an array populated with the results of [calling a provided function on every element](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) in the provided array.

## _array.pop

```
(array: any[]): any[]
```

The `_array.pop` method returns the array [with its last item removed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop). Unlike the JavaScript method, it returns the changed array, not the removed item; use `_array.at` with index `-1` to get the last item.

## _array.push

```
(arguments: {
  on: any[],
  items: any[]
}): any[]
(arguments: [
  on: any[],
  ...items: any[]
]): any[]
```

The `_array.push` method returns the array [with the items added to the end](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push). Unlike the JavaScript method, it returns the changed array, not its new length.

## _array.reduce

```
(arguments: {
  on: any[],
  callback: function,
  initialValue?: any
}): any
(arguments: [
  on: any[],
  callback: function,
  initialValue?: any
]): any
```

The `_array.reduce` method [executes a reducer function on each element of the array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce), resulting in single output value.

#### Examples

The simplest example would probably be adding all the elements in an array:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __args: 1
```
This will return `sum: 10`

You can start off by counting from 10 by specifying an `initialValue` for the reducer:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __args: 1
    initialValue: 10
```
This will return `sum: 20`

You can use the index of the array element to add some logic to your `callback`. For instance, when you reach index 2 of your array (the 3rd entry), add 100 instead of the current element value:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __if:
              test:
                __eq:
                  - __args: 2
                  - 2
              then: 100
              else:
                __args: 1
```
This will return `sum: 107`

## _array.reduceRight

```
(arguments: {
  on: any[],
  callback: function,
  initialValue?: any
}): any
(arguments: [
  on: any[],
  callback: function,
  initialValue?: any
]): any
```

The `_array.reduceRight` method [applies a function against an accumulator and each value of the array (from right-to-left)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/ReduceRight) to reduce it to a single value.

## _array.reverse

```
(array: any[]}): any[]
```

The `_array.reverse` method [reverses](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse) an array.

## _array.shift

```
(array: any[]): any[]
```

The `_array.shift` method returns the array [with its first item removed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift). Unlike the JavaScript method, it returns the changed array, not the removed item; use `_array.at` with index `0` to get the first item.

## _array.slice

```
(arguments: {
  on: any[],
  start?: number,
  end?: number
}): number
(arguments: [
  on: any[],
  start?: number,
  end?: number
]): number
```

The `_array.slice` method returns [a portion of an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) selected from `start` to `end` (end not included) where `start` and `end` represent the index of items in that array.

## _array.some

```
(arguments: {
  on: any[],
  callback: function,
}): boolean
(arguments: [
  on: any[],
  callback: function,
]): boolean
```

The `_array.some` method tests whether [at least one element in the array passes the test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some) implemented by the provided function. It returns a Boolean value.

## _array.sort

```
(arguments: {on: any[]}): number
```

The `_array.sort` method [sorts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) the elements of an array. The sort order is ascending, built upon converting the elements into strings, then comparing their sequences of UTF-16 code units values.

## _array.splice

```
(arguments: {
  on: any[],
  start: number,
  deleteCount?: number
  insert: any[]
}): number
(arguments: {
  on: any[],
  start: number,
  deleteCount?: number,
  insert: any[]
}): number
```

The `_array.splice` method [changes the contents of an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) by removing or replacing existing elements and/or adding new elements.

## _array.unshift

```
(arguments: {
  on: any[],
  items: any[]
}): any[]
(arguments: [
  on: any[],
  ...items: any[]
]): any[]
```

The `_array.unshift` method returns the array [with the items added to the start](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift). Unlike the JavaScript method, it returns the changed array, not its new length.
