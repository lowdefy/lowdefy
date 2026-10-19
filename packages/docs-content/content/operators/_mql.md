# _mql

The `_mql` operator uses the [`mingo`](https://www.npmjs.com/package/mingo) package to evaluate MongoDB query language statements as an operator.

# Operator methods:

## _mql.aggregate

```
({on: object[], pipeline: object[]}): object[]
([on: object[], pipeline: object[]]): object[]
```

The `_mql.aggregate` method runs a MongoDB aggregation pipeline on an input array.

#### Arguments

###### object
  - `on: object[]`: The data array on which to run the pipeline. It should be an array of objects.
  - `pipeline: object[]`: A MongoDB aggregation pipeline definition.

#### Examples

###### Transform request results:
```yaml
_mql.aggregate:
  pipeline:
    - $match:
        age:
          $gte: 18
    - $addFields:
        averageScore:
          $avg:
            - $score1
            - $score2
  on:
    _request: my_request
```

## _mql.expr

```
({on: object, expr: any}): any
([on: object, expr: any]): any
```

The `_mql.expr` method evaluates a MongoDB aggregation pipeline operator expression. This is any statement that could be written in a `$project` stage.

#### Arguments

###### object
  - `on: object`: An object to take as input for the expression.
  - `expr: object`: A MongoDB aggregation expression.

#### Examples

###### Calculate an average of three inputs:
```yaml
_mql.expr:
  expr:
    $avg:
      - $input1
      - $input2
      - $input3
  on:
    _state: true
```

## _mql.test

```
({on: object, test: object}): boolean
([on: object, test: object]): boolean
```

The `_mql.test` method tests if a object matches a MongoDB filter/query expression.

#### Arguments

###### object
  - `on: object`: The object to be tested.
  - `test: object`: A MongoDB filter/query expression.

#### Examples

###### Test if a number input is greater than 100:
```yaml
_mql.test:
  test:
    number_input:
      $gte: 18
  on:
    number_input:
      _state: number_input
```
