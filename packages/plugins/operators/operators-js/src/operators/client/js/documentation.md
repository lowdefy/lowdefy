<TITLE>
_js
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_js` operator enables the use of custom JavaScript logic within Lowdefy configuration where operators are evaluated. The purpose of this operator is to facilitate quick implementation of fast, synchronous functions. Like other operators, these functions are evaluated during page render, thus slow functions can impact app performance.
For more advanced logic, or when the use of external dependencies is necessary, instead develop a [custom plugin](/plugins-introduction).

#### Using Lowdefy operators in JavaScript

Certain Lowdefy operators can be used inside of the JavaScript function block. These operators are available as functions and will take their standard arguments.

###### Client JavaScript function prototype:

_Function parameters passed to the operator method._

```js
function ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) {
  // Your JavaScript code here
};
```

The function arguments available to the JavaScript function are:

- `actions: function`: Implements the [\_actions](/_actions) operator.
- `event: function`: Implements the [\_event](/_event) operator.
- `input: function`: Implements the [\_input](/_input) operator.
- `location: function`: Implements the [\_location](/_location) operator.
- `lowdefyGlobal: function`: Implements the [\_global](/_global) operator.
- `request: function`: Implements the [\_request](/_request) operator.
- `state: function`: Implements the [\_state](/_state) operator.
- `urlQuery: function`: Implements the [\_url_query](/_url_query) operator.
- `user: function`: Implements the [\_user](/_user) operator.
  </DESCRIPTION>

<USAGE>
```
(function: string): any
```

###### string

The JavaScript function body, including the function return statement, excluding the function prototype.
</USAGE>

<EXAMPLES>
###### Perform a calculation:
```js
_js: |
  let x = state('input_1');
  let y = state('input_2');
  return x + y;
```

###### Create custom logic based on data from a request:

```js
_js: |
  const products = request('get_products').data?.products ?? [];
  const laptopsWithRatingGreaterThan4 = products.filter(product =>
      product.category === "laptops" && product.rating > 4
  );
  if (laptopsWithRatingGreaterThan4.length > 3) {
      return true;
  }
  return false;
```

###### Chain array methods on request data:

```js
_js: |
  const products = request('get_products').data?.products ?? [];
  const totalPriceOfPhones = products
      .filter(product => product.category === "smartphones")
      .reduce((acc, product) => acc + product.price, 0);
  return totalPriceOfPhones;
```

</EXAMPLES>
