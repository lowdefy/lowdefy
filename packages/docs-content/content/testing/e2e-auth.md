# Testing Authentication

When your app uses authentication, e2e tests need a way to set user sessions without going through a real login flow. The `@lowdefy/e2e-utils` package provides cookie-based user injection that works with Lowdefy's auth system.

When you run e2e tests, a special e2e server is used instead of the production server. This server reads the test user from a browser cookie instead of using the Auth.js engine, so your tests can set any user object and have it work with Lowdefy's page protection and role-based access control.

## Setting a default user

Define a default test user in your `mocks.yaml` file. This user is applied to every test automatically:

```yaml
# e2e/mocks.yaml
user:
  name: Test User
  email: test@example.com
  roles:
    - admin
```

The user object maps directly to `lowdefy.user` with no transforms. Whatever you set here is exactly what your app receives.

> Your app must have <code>auth</code> configured in <code>lowdefy.yaml</code> for page protection to work. The e2e server respects the same <code>pages.public</code>, <code>pages.protected</code>, and <code>pages.roles</code> settings as the production server.

## Setting users per test

Use `ldf.user()` to set or change the user for a specific test:

```javascript
import { test } from './fixtures.js';

test('admin can access dashboard', async ({ ldf }) => {
  await ldf.user({ name: 'Admin', roles: ['admin'] });
  await ldf.goto('/dashboard');
  await ldf.url().expect.toBe('/dashboard');
});
```

If you have a default user in `mocks.yaml`, calling `ldf.user()` overrides it for that test only. Other tests still use the default.

## Testing without a user

Clear the user with `ldf.user(null)` to test unauthenticated access:

```javascript
test('unauthenticated user is redirected to login', async ({ ldf }) => {
  await ldf.user(null);
  await ldf.goto('/dashboard');
  await ldf.url().expect.toBe('/login');
});

test('public page loads without login', async ({ ldf }) => {
  await ldf.user(null);
  await ldf.goto('/login');
  await ldf.url().expect.toBe('/login');
});
```

When no user is set and the requested page is protected, the server redirects to the 404 page. If the 404 page has logic to redirect to a login page, the user will be redirected there.

## Testing role-based access

Set specific roles on the user to test role-based page protection:

```javascript
test('viewer cannot access admin page', async ({ ldf }) => {
  await ldf.user({ name: 'Viewer', roles: ['viewer'] });
  await ldf.goto('/admin-settings');
  // Redirects because user lacks 'admin' role
  await ldf.url().expect.toBe('/login');
});

test('admin can access admin page', async ({ ldf }) => {
  await ldf.user({ name: 'Admin', roles: ['admin'] });
  await ldf.goto('/admin-settings');
  await ldf.url().expect.toBe('/admin-settings');
});
```

## Complete example

Here is a full test file that covers common authentication scenarios:

```javascript
import { test } from './fixtures.js';

test('protected page loads with authenticated user', async ({ ldf }) => {
  // Default user from mocks.yaml is used (has admin role)
  await ldf.goto('/home');
  await ldf.url().expect.toBe('/home');
});

test('public page loads without user', async ({ ldf }) => {
  await ldf.user(null);
  await ldf.goto('/login');
  await ldf.url().expect.toBe('/login');
});

test('protected page redirects without user', async ({ ldf }) => {
  await ldf.user(null);
  await ldf.goto('/home');
  await ldf.url().expect.toBe('/login');
});
```

## Limitations

- **Sign-in and sign-out are not supported.** If your app uses the Login or Logout actions, the e2e server will throw an error. Test login flows by setting the user directly with `ldf.user()` instead.
- **No session callbacks.** The user object is passed through as-is. If your production app transforms the session via callbacks (for example, mapping `userFields`), those transforms do not run in e2e tests.
