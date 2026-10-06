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
    description: 'Parameters passed to the logout method.',
    properties: {
      callbackUrl: {
        type: 'object',
        description:
          'Structured callback target for where a signed-out user lands, basePath-prefixed. Unlike the sign-in actions this has no default and does not read the ?callbackUrl= query: with no target the session provider reloads the page and the server re-applies the page auth fork, which sends a protected page to the sign-in page.',
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
              'The URL to land on. An absolute URL is not basePath-prefixed, so it can be an external logout landing page.',
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
    },
  },
};
