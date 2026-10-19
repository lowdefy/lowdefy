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
    description: 'Parameters passed to the send-verification-email method.',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the unverified account to send the verification email to.',
      },
      callbackUrl: {
        type: 'object',
        description:
          'Structured callback target for where the emailed verification link lands after verifying, basePath-prefixed. Defaults to the auth.authPages.verifyEmail page, which receives ?error= when the link is invalid or expired. A false value is not valid here: the destination belongs to a redirect hop this action cannot suppress.',
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
