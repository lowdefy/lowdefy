# Introduction

Lowdefy uses the [Auth.js](https://authjs.dev) library to implement user authentication. Auth.js has built in support for many sign-in services, and can be extended using Lowdefy [plugins](/plugins). User authentication can be stateless using JSON Web Tokens (JWT) or can use database sessions.

User authorization is done at the page level. Pages can be set as public or private, and role-based-access control can be used to [restrict access](https://docs.lowdefy.com/protected-pages-apis) to pages and APIs based on a user's [roles](https://docs.lowdefy.com/roles). Authorisation checks are done on the Lowdefy server when executing requests, respecting the same authorization rules as the page the request is defined on.

The authentication system consists of the following components:

## Providers

Providers configure the identity provider used to authenticate the user. These are typically OAuth based identity providers like Google or Auth0. All the default providers in the Auth.js library can be used, and additional providers can be added as plugins. Multiple providers can be configured, but at least one should be configured to have a working authentication system.

## Adapters

Adapters configure the connection to the database if a database is used, allowing for database sessions. This is optional, and JSON Web Tokens will be used if no adapter is configured.

## Callbacks

Callbacks are functions that are executed during certain actions of the authentication process. They are blocking - if an error is thrown they stop the action, so they can be used for access control checks. A few default callbacks are provided, but a [custom plugin](https://docs.lowdefy.com/plugins-dev) will likely need to be written.

## Events

Events are functions that are executed after certain actions of the authentication process. They are not blocking to authentication, and are best used for audit logs/ reporting or other side effects.

## Login and Logout actions

The Login and Logout actions are used to start the login and logout processes.

## \_user operator

The `_user` operator can be used to access data in the user object received from the identity provider. The OpenID Connect standard claims (fields like `name` or `email`) are mapped to the user object by default and addition fields can be configured using the `userFields` configuration option.

### `twoFactorEnrolled`

`_user: twoFactorEnrolled` is `true` when the caller holds a factor that satisfies [`auth.twoFactor.required`](/two-factor) — a TOTP enrolment **or** a registered passkey.

It is a fact about the **user**, not the session: it does not assert that a factor was presented on this sign-in, only that the user has one on file. (The name is imperfect — a passkey is not literally a second factor. The field means precisely "holds a factor that satisfies `auth.twoFactor.required`", which a passkey does on its own.)

It is present only on session-resolved callers. The API strategy and the injected callers used in dev and e2e carry no session and so do not carry this field.
