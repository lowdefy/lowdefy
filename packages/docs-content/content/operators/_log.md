# _log

```
(value: any): any
```

The `_log` operator logs it input to the console, and returns the value it received. Since it returns the value it received, it can be used to debug without affecting the rest of the configuration.

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### any

#### Examples

###### Log the results of a request to the console:
```yaml
_log:
  _request: my_request
```
Returns: The value of the request
