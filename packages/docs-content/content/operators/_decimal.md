# _decimal

```
(decimal: string): { '~dec': string }
```

The `_decimal` operator writes an exact decimal, for a MongoDB Decimal128 field such as money or a stock quantity. It takes the decimal as a string and returns the decimal marker `{ '~dec': '19.99' }`. A MongoDB request stores the marker as a Decimal128, and MongoDB returns a Decimal128 to the page as the same marker. The value never passes through a JavaScript number. See [MongoDB decimals](/MongoDB).

The decimal must be a string with at most 34 significant digits. Quote the value in YAML, since `19.99` unquoted is a number and fails with an error. A decimal that was read earlier, such as `{ '~dec': '0.3' }` in state, is accepted and returned unchanged.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### string
The decimal as a string, such as `'19.99'`, `'-0.5'` or `'1.5E-7'`.

#### Examples

###### Write an exact decimal in a MongoDB document:
```yaml
amount:
  _decimal: '19.99'
```
Returns: `{ '~dec': '19.99' }`

###### Write a decimal that a page sent:
```yaml
amount:
  _decimal:
    _payload: amount
```

###### A number is refused:
```yaml
_decimal: 19.99
```
Returns: `null` and throws an operator error that says to quote the value.
