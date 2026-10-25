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
    description:
      'Parameters for trading a sign-in token for a session. The token is the one a routine minted with the CreateSignInToken step and put into an app email link. The action lands on the landing the token was minted with - it takes no destination of its own.',
    required: ['token'],
    additionalProperties: false,
    properties: {
      token: {
        type: 'string',
        description:
          'The sign-in token from the email link, usually read from the landing page URL query. The action fails when it is not a non-empty string, or when the server refuses it (unknown, already used, expired, revoked, wrong organization, banned, or a user with a second factor enrolled) - catch the failure and fall back to an ordinary sign-in.',
      },
    },
  },
};
