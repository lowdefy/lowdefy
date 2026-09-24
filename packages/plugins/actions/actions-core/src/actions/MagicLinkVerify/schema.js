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

const callbackTargetProperties = {
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
};

export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Parameters for spending the magic-link token. All are optional: the sign-in email links to the landing page named by "auth.authPages.magicLink" with the token and the callback destinations already on its URL query, and this action reads its defaults from there. Set a parameter only to override what the email carried.',
    properties: {
      token: {
        type: 'string',
        description:
          'The single-use magic-link token. Defaults to the "token" URL query parameter of the landing page. The action fails when neither is a string, because there is nothing to verify.',
      },
      callbackUrl: {
        type: 'object',
        description:
          'Where a successful sign-in lands. Defaults to the "callbackURL" URL query parameter the sign-in email carried onto the landing page, and to BetterAuth\'s own default when that is absent too. "false" is not valid here - verification redirects through a hop the app does not control, so there is no staying put.',
        properties: callbackTargetProperties,
      },
      newUserCallbackUrl: {
        type: 'object',
        description:
          'Where a sign-in that creates a new account lands, for a first-run or onboarding page. Defaults to the "newUserCallbackURL" URL query parameter, and to callbackUrl when neither is set.',
        properties: callbackTargetProperties,
      },
      errorCallbackUrl: {
        type: 'object',
        description:
          'Where a failed verification lands, with the reason in "?error=". Defaults to the "errorCallbackURL" URL query parameter, then to the app\'s "auth.authPages.error" page.',
        properties: callbackTargetProperties,
      },
    },
  },
};
