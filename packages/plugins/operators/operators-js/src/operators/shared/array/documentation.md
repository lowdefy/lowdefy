<TITLE>_array</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.</DESCRIPTION>
<USAGE>The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.</USAGE>
<EXAMPLES>The simplest example would probably be adding all the elements in an array:
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

This will return `sum: 107`</EXAMPLES>
