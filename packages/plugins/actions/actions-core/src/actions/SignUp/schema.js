/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the sign-up method (email/password only).',
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the account to create.',
      },
      password: {
        type: 'string',
        description: 'Password for the new account.',
      },
      name: {
        type: 'string',
        description: 'Name of the user.',
      },
      callbackUrl: {
        type: 'object',
        description:
          'Structured callback target for where the new account lands - both where the emailed verification link goes and, when the response carries a session, where the browser navigates. basePath-prefixed. When omitted, the verification link lands on the auth.authPages.verifyEmail page (with ?error= when the link is invalid or expired), and a session-bearing response navigates to the ?callbackUrl= query, else the home page. A false value is not valid here: the same value is the emailed link destination, which SignUp cannot suppress.',
        properties: {
          home: {
            type: 'boolean',
            description: "Land on the app's home page.",
          },
          pageId: {
            type: 'string',
            description: 'The pageId to land on.',
          },
          url: {
            type: 'string',
            description:
              'The URL to land on. An absolute URL is not basePath-prefixed, so it can be an external landing page.',
          },
          urlQuery: {
            type: 'object',
            description: 'The urlQuery to set on the destination.',
          },
          pathParams: {
            type: 'object',
            description:
              "Values for the placeholders in the destination page's path, by placeholder name.",
          },
        },
      },
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
