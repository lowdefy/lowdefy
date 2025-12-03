<TITLE>
_js
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_js` operator enables custom JavaScript logic within Lowdefy configuration where operators are evaluated. This allows you to implement calculations, transformations, and conditional logic that would be complex or impossible with standard operators.

**Important Considerations:**

- Functions are evaluated synchronously during page render
- Slow functions can impact app performance
- For complex logic or external dependencies, develop a [custom plugin](/plugins-introduction)

#### Using Lowdefy Operators in JavaScript

The JavaScript function receives an object with operator functions that mirror their Lowdefy counterparts:

```js
function ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) {
  // Your JavaScript code here
}
```

**Available Functions:**

- `actions(key)` - Implements the [`_actions`](/_actions) operator
- `event(key)` - Implements the [`_event`](/_event) operator
- `input(key)` - Implements the [`_input`](/_input) operator
- `location(key)` - Implements the [`_location`](/_location) operator
- `lowdefyGlobal(key)` - Implements the [`_global`](/_global) operator
- `request(key)` - Implements the [`_request`](/_request) operator
- `state(key)` - Implements the [`_state`](/_state) operator
- `urlQuery(key)` - Implements the [`_url_query`](/_url_query) operator
- `user(key)` - Implements the [`_user`](/_user) operator
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

###### Example 1: Basic arithmetic calculation

Perform a simple calculation with state values.

```yaml
id: total_display
type: Statistic
properties:
  title: Calculated Total
  value:
    _js: |
      const quantity = state('order.quantity') || 0;
      const unitPrice = state('order.unit_price') || 0;
      const taxRate = state('tax_rate') || 0.1;

      const subtotal = quantity * unitPrice;
      const tax = subtotal * taxRate;
      return subtotal + tax;
```

---

###### Example 2: Array filtering and transformation

Process array data with JavaScript array methods.

```yaml
id: active_users_count
type: Statistic
properties:
  title: Active Premium Users
  value:
    _js: |
      const users = request('get_users') || [];

      const activePremiumUsers = users.filter(user => 
        user.status === 'active' && 
        user.subscription_type === 'premium' &&
        new Date(user.subscription_end) > new Date()
      );

      return activePremiumUsers.length;
```

---

###### Example 3: Complex conditional logic

Implement multi-condition business logic.

```yaml
id: shipping_cost
type: Paragraph
properties:
  content:
    _js: |
      const orderTotal = state('cart.total') || 0;
      const shippingMethod = state('checkout.shipping_method');
      const userTier = user('app_attributes.tier') || 'standard';
      const destination = state('checkout.country');

      // Free shipping for premium users over $100
      if (userTier === 'premium' && orderTotal >= 100) {
        return 'Free Shipping';
      }

      // International shipping rates
      const internationalCountries = ['CA', 'GB', 'AU', 'DE', 'FR'];
      const isInternational = internationalCountries.includes(destination);

      let baseCost = isInternational ? 25 : 10;

      // Adjust for shipping method
      switch (shippingMethod) {
        case 'express':
          baseCost *= 2;
          break;
        case 'overnight':
          baseCost *= 3;
          break;
        default:
          break;
      }

      // Free domestic standard shipping over $50
      if (!isInternational && shippingMethod === 'standard' && orderTotal >= 50) {
        return 'Free Shipping';
      }

      return `$${baseCost.toFixed(2)}`;
```

---

###### Example 4: Data aggregation and grouping

Aggregate data from requests for display.

```yaml
id: sales_summary
type: Descriptions
properties:
  items:
    _js: |
      const orders = request('get_monthly_orders') || [];

      // Group orders by status
      const grouped = orders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        if (!acc[status]) {
          acc[status] = { count: 0, total: 0 };
        }
        acc[status].count += 1;
        acc[status].total += order.amount || 0;
        return acc;
      }, {});

      // Calculate overall statistics
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      const avgOrderValue = orders.length > 0 
        ? totalRevenue / orders.filter(o => o.status === 'completed').length 
        : 0;

      return [
        { label: 'Total Orders', value: orders.length },
        { label: 'Completed', value: grouped.completed?.count || 0 },
        { label: 'Pending', value: grouped.pending?.count || 0 },
        { label: 'Cancelled', value: grouped.cancelled?.count || 0 },
        { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
        { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}` }
      ];
```

---

###### Example 5: Dynamic form validation and formatting

Create complex validation logic and data formatting.

```yaml
id: form_validation_message
type: Alert
visible:
  _js: |
    const email = state('form.email') || '';
    const phone = state('form.phone') || '';
    const birthDate = state('form.birth_date');

    // Check if any validation errors exist
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = /^\+?[\d\s-]{10,}$/.test(phone.replace(/\s/g, ''));

    let ageValid = true;
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
      ageValid = age >= 18 && age <= 120;
    }

    return !emailValid || !phoneValid || !ageValid;
properties:
  type: error
  message:
    _js: |
      const errors = [];
      const email = state('form.email') || '';
      const phone = state('form.phone') || '';
      const birthDate = state('form.birth_date');

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
      }

      if (phone && !/^\+?[\d\s-]{10,}$/.test(phone.replace(/\s/g, ''))) {
        errors.push('Phone number must be at least 10 digits');
      }

      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          errors.push('You must be at least 18 years old');
        } else if (age > 120) {
          errors.push('Please enter a valid birth date');
        }
      }

      return errors.length > 0
        ? 'Please fix the following errors: ' + errors.join('; ')
        : '';

id: formatted_phone_display
type: Paragraph
properties:
  content:
    _js: |
      const phone = state('form.phone') || '';
      const digits = phone.replace(/\D/g, '');

      if (digits.length === 10) {
        // Format as (XXX) XXX-XXXX
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits[0] === '1') {
        // Format as +1 (XXX) XXX-XXXX
        return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
      }

      return phone;
```

</EXAMPLES>
