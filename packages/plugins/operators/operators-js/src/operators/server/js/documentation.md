<TITLE>
_js
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_js` operator enables custom JavaScript logic within server-side Lowdefy configuration, including API routines, requests, and connections. This allows you to implement complex calculations, data transformations, and business logic that would be difficult with standard operators.

**Important Considerations:**

- Functions are evaluated synchronously
- Slow functions can impact API response times
- For complex logic or external dependencies, develop a [custom plugin](/plugins-introduction)

#### Using Lowdefy Operators in JavaScript

The server-side JavaScript function receives a different set of operator functions than the client:

```js
function ({ payload, secret, user, item, step, state }) {
  // Your JavaScript code here
}
```

**Available Functions:**

- `payload(key)` - Implements the [`_payload`](/_payload) operator
- `secret(key)` - Implements the [`_secret`](/_secret) operator
- `user(key)` - Implements the [`_user`](/_user) operator
- `item(key)` - Implements the [`_item`](/_item) operator (in loops)
- `step(key)` - Implements the [`_step`](/_step) operator
- `state(key)` - Implements the [`_state`](/_state) operator (in API routines)
  </DESCRIPTION>

<SCHEMA>
```yaml
_js:
  type: string
  description: |
    The JavaScript function body as a multi-line string.
    Include the return statement to return a value.
    Do not include the function declaration - only the function body.
  returns: any
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Complex data transformation

Transform and validate incoming payload data.

```yaml
id: process-order
type: Api
routine:
  - :set_state:
      processed_items:
        _js: |
          const items = payload('order_items') || [];
          const taxRate = 0.1;

          return items.map((item, index) => {
            const subtotal = item.quantity * item.unit_price;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;
            
            return {
              line_number: index + 1,
              product_id: item.product_id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: Math.round(subtotal * 100) / 100,
              tax: Math.round(tax * 100) / 100,
              total: Math.round(total * 100) / 100
            };
          });

  - :set_state:
      order_totals:
        _js: |
          const items = state('processed_items') || [];

          const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
          const tax = items.reduce((sum, item) => sum + item.tax, 0);
          const total = items.reduce((sum, item) => sum + item.total, 0);

          return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            total: Math.round(total * 100) / 100,
            item_count: items.length
          };

  - :return:
      items:
        _state: processed_items
      totals:
        _state: order_totals
```

---

###### Example 2: Business logic validation

Implement complex validation rules with JavaScript.

```yaml
id: validate-reservation
type: Api
routine:
  - :set_state:
      validation_result:
        _js: |
          const startDate = new Date(payload('start_date'));
          const endDate = new Date(payload('end_date'));
          const guests = payload('guest_count') || 0;
          const userTier = user('app_attributes.membership_tier') || 'standard';

          const errors = [];
          const warnings = [];

          // Date validation
          const now = new Date();
          const minBookingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

          if (startDate < minBookingDate) {
            errors.push('Reservations must be made at least 24 hours in advance');
          }

          if (endDate <= startDate) {
            errors.push('End date must be after start date');
          }

          // Duration validation
          const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
          const maxDuration = userTier === 'premium' ? 14 : 7;

          if (durationDays > maxDuration) {
            errors.push(`Maximum reservation duration is ${maxDuration} days for ${userTier} members`);
          }

          // Guest count validation
          if (guests < 1 || guests > 10) {
            errors.push('Guest count must be between 1 and 10');
          }

          if (guests > 6 && userTier !== 'premium') {
            warnings.push('Large group reservations (7+) may require premium membership for peak times');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings,
            computed: {
              duration_days: durationDays,
              user_tier: userTier,
              max_duration: maxDuration
            }
          };

  - :if:
      _not:
        _state: validation_result.valid
    :then:
      - :reject:
          errors:
            _state: validation_result.errors
          warnings:
            _state: validation_result.warnings

  - :return:
      _state: validation_result
```

---

###### Example 3: Data aggregation in loops

Use JavaScript within loop iterations for complex calculations.

```yaml
id: calculate-inventory-metrics
type: Api
routine:
  - id: get_products
    type: MongoDBFind
    connectionId: products
    properties:
      query:
        active: true

  - :set_state:
      metrics:
        total_value: 0
        low_stock_count: 0
        out_of_stock_count: 0
        categories: {}

  - :for: product
    :in:
      _step: get_products
    :do:
      - :set_state:
          metrics:
            _js: |
              const current = state('metrics');
              const product = item('product');

              const stockValue = (product.quantity || 0) * (product.unit_cost || 0);
              const category = product.category || 'Uncategorized';

              // Update category statistics
              if (!current.categories[category]) {
                current.categories[category] = {
                  count: 0,
                  total_stock: 0,
                  total_value: 0
                };
              }

              current.categories[category].count += 1;
              current.categories[category].total_stock += product.quantity || 0;
              current.categories[category].total_value += stockValue;

              return {
                total_value: current.total_value + stockValue,
                low_stock_count: current.low_stock_count + (product.quantity < product.reorder_level ? 1 : 0),
                out_of_stock_count: current.out_of_stock_count + (product.quantity === 0 ? 1 : 0),
                categories: current.categories
              };

  - :return:
      _state: metrics
```

---

###### Example 4: Dynamic query building

Construct complex database queries based on parameters.

```yaml
id: search-records
type: Api
routine:
  - :set_state:
      query:
        _js: |
          const filters = payload('filters') || {};
          const query = {};

          // Text search
          if (filters.search_text) {
            query.$text = { $search: filters.search_text };
          }

          // Date range
          if (filters.date_from || filters.date_to) {
            query.created_at = {};
            if (filters.date_from) {
              query.created_at.$gte = new Date(filters.date_from);
            }
            if (filters.date_to) {
              query.created_at.$lte = new Date(filters.date_to);
            }
          }

          // Status filter (can be array or single value)
          if (filters.status) {
            if (Array.isArray(filters.status)) {
              query.status = { $in: filters.status };
            } else {
              query.status = filters.status;
            }
          }

          // Numeric range filters
          if (filters.min_amount !== undefined || filters.max_amount !== undefined) {
            query.amount = {};
            if (filters.min_amount !== undefined) {
              query.amount.$gte = filters.min_amount;
            }
            if (filters.max_amount !== undefined) {
              query.amount.$lte = filters.max_amount;
            }
          }

          // User-specific filter
          const userId = user('id');
          if (filters.my_records_only) {
            query.created_by = userId;
          }

          return query;

  - id: execute_search
    type: MongoDBFind
    connectionId: records
    properties:
      query:
        _state: query
      options:
        limit:
          _payload: page_size
        skip:
          _product:
            - _subtract:
                - _payload: page
                - 1
            - _payload: page_size

  - :return:
      results:
        _step: execute_search
      query_used:
        _state: query
```

---

###### Example 5: Secure token generation and validation

Create and verify secure tokens for authentication flows.

```yaml
id: generate-access-token
type: Api
routine:
  - :set_state:
      token_payload:
        _js: |
          const userId = user('id');
          const permissions = payload('requested_permissions') || [];
          const tokenSecret = secret('TOKEN_SECRET');

          // Create token data
          const now = Date.now();
          const expiresIn = 3600000; // 1 hour

          const tokenData = {
            sub: userId,
            iat: now,
            exp: now + expiresIn,
            permissions: permissions.filter(p => 
              ['read', 'write', 'admin'].includes(p)
            ),
            jti: Math.random().toString(36).substring(2) + now.toString(36)
          };

          // Create signature (simplified - use JWT library in production)
          const dataString = JSON.stringify(tokenData);

          return {
            data: tokenData,
            data_string: dataString,
            expires_at: new Date(now + expiresIn).toISOString()
          };

  - :set_state:
      signature:
        _hash.sha256:
          _string.concat:
            - _state: token_payload.data_string
            - _secret: TOKEN_SECRET

  - id: store_token
    type: MongoDBInsertOne
    connectionId: access_tokens
    properties:
      doc:
        user_id:
          _user: id
        token_id:
          _state: token_payload.data.jti
        permissions:
          _state: token_payload.data.permissions
        expires_at:
          _state: token_payload.expires_at
        created_at:
          _date: now

  - :return:
      token:
        _base64.encode:
          _string.concat:
            - _state: token_payload.data_string
            - '.'
            - _state: signature
      expires_at:
        _state: token_payload.expires_at
      token_id:
        _state: token_payload.data.jti
```

</EXAMPLES>
