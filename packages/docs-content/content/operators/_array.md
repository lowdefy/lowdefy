# _array

The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

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

## _array.flat

```
(arguments: {on: any[], depth?: number}): any[]
(arguments: [on: any[], depth?: number]): any[]
```

The `_array.flat` method returns a array with all [sub-array elements concatenated into it recursively](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) up to the specified `depth`.

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

The `_array.slice` method [changes the contents of an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) by removing or replacing existing elements and/or adding new elements.
