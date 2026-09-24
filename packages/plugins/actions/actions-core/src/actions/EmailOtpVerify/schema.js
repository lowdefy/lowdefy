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
    description: 'Parameters passed to the email one-time-code verify method.',
    required: ['email', 'otp'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address the code was sent to.',
      },
      otp: {
        type: 'string',
        description: 'The one-time code from the email.',
      },
      callbackUrl: {
        oneOf: [
          {
            type: 'object',
            description:
              "Structured callback target for where a successful sign-in lands, basePath-prefixed. Defaults to the app's home page when omitted and no ?callbackUrl= query is present; a ?callbackUrl= query set by the unauthenticated-page redirect wins over that default, and this param wins over both.",
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
            },
          },
          {
            enum: [false],
            description:
              'Do not navigate - the session store re-renders the page with the new user in place, for a sign-in form in a modal or an embedded panel.',
          },
        ],
      },
    },
  },
};
