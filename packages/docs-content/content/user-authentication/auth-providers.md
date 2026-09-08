# Authentication Providers

Providers are used to configure the identity providers that will be used to authenticate users. To add user authentication to your app, at least one provider must be configured. More than one provider can be configured to allow users to sign in using their choice of identity provider.

## OAuth Providers

Auth.js supports a large number of OAuth identity providers. During the OAuth flow, a user is redirected to a webpage hosted by the provider, where they usually authenticate using their credentials if not already signed in. They are then redirected back to the Lowdefy application, and the Lowdefy application interacts with the providers's API to verify the login and get the user details like name and email address.

## Email Provider

Auth.js supports email login, where a link with a token is sent to the user's email address and the user can click on the link to log in (often called "magic links"). To use email authentication an Adapter must be configured, since the verification tokens need to be stored in a database.

## Credentials Provider

Auth.js provides a credentials provider, which can be used to sign in using any other credentials, such as username and password or Web3. Lowdefy does not provide any credential providers, but a credentials provider can be written as a [plugin](/plugins-dev).
